// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CharityCampaignFactory
 * @dev Factory contract to create and manage charity campaigns with real-world best practices
 */
contract CharityCampaignFactory is Ownable, ReentrancyGuard {
    // Constants for best practices
    uint256 public constant MIN_CAMPAIGN_DURATION = 1 days;
    uint256 public constant MAX_CAMPAIGN_DURATION = 365 days;
    uint256 public constant DONATION_GRACE_PERIOD = 24 hours;
    uint256 public constant MIN_GOAL_AMOUNT = 0.01 ether;
    
    struct Campaign {
        address payable beneficiary;
        string title;
        string description;
        uint256 goalAmount;
        uint256 deadline;
        uint256 totalRaised;
        bool finalized;
        bool refundEnabled;
        address creator;
    string dbUuid; // Database UUID for off-chain metadata
        bool paused; // Emergency pause by owner
        bool cancelled; // Cancelled by creator
        uint256 createdAt; // Campaign creation timestamp
    }
    
    struct Donation {
        uint256 amount;
        uint256 timestamp;
        bool refunded;
    }

    Campaign[] public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => mapping(address => Donation)) public donations; // Track individual donations with timestamp
    mapping(address => uint256[]) public userCampaigns;
    mapping(uint256 => address[]) public campaignDonors;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        address indexed beneficiary,
        string title,
        uint256 goalAmount,
        uint256 deadline,
        string dbUuid
    );

    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount
    );

    event CampaignFinalized(
        uint256 indexed campaignId,
        uint256 totalRaised,
        bool goalReached
    );

    event RefundIssued(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount
    );

    event CampaignEdited(
        uint256 indexed campaignId,
        string newTitle,
        string newDescription
    );
    
    event CampaignPaused(
        uint256 indexed campaignId,
        address indexed admin
    );
    
    event CampaignUnpaused(
        uint256 indexed campaignId,
        address indexed admin
    );
    
    event CampaignCancelled(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 totalRefunded
    );
    
    event DonationCancelled(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount
    );

    modifier campaignExists(uint256 _campaignId) {
        require(_campaignId < campaigns.length, "Campaign does not exist");
        _;
    }

    modifier campaignActive(uint256 _campaignId) {
        Campaign memory campaign = campaigns[_campaignId];
        require(!campaign.finalized, "Campaign already finalized");
        require(!campaign.paused, "Campaign is paused");
        require(!campaign.cancelled, "Campaign has been cancelled");
        require(block.timestamp < campaign.deadline, "Campaign deadline passed");
        _;
    }
    
    modifier onlyCreatorOrOwner(uint256 _campaignId) {
        Campaign memory campaign = campaigns[_campaignId];
        require(
            msg.sender == campaign.creator || msg.sender == owner(),
            "Only creator or owner can perform this action"
        );
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new charity campaign
     * @param _beneficiary Address that will receive funds
     * @param _title Campaign title
     * @param _description Campaign description
     * @param _goalAmount Fundraising goal in wei
     * @param _durationDays Campaign duration in days
    * @param _dbUuid Database UUID for off-chain metadata storage
     */
    function createCampaign(
        address payable _beneficiary,
        string memory _title,
        string memory _description,
        uint256 _goalAmount,
        uint256 _durationDays,
        string memory _dbUuid
    ) external returns (uint256) {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(_goalAmount >= MIN_GOAL_AMOUNT, "Goal amount too low");
        require(_durationDays > 0, "Duration must be positive");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_title).length <= 200, "Title too long");
    require(bytes(_dbUuid).length > 0, "Invalid database UUID");

        uint256 durationInSeconds = _durationDays * 1 days;
        require(durationInSeconds >= MIN_CAMPAIGN_DURATION, "Campaign duration too short");
        require(durationInSeconds <= MAX_CAMPAIGN_DURATION, "Campaign duration too long");

        uint256 deadline = block.timestamp + durationInSeconds;

        Campaign memory newCampaign = Campaign({
            beneficiary: _beneficiary,
            title: _title,
            description: _description,
            goalAmount: _goalAmount,
            deadline: deadline,
            totalRaised: 0,
            finalized: false,
            refundEnabled: false,
            creator: msg.sender,
            dbUuid: _dbUuid,
            paused: false,
            cancelled: false,
            createdAt: block.timestamp
        });

        campaigns.push(newCampaign);
        uint256 campaignId = campaigns.length - 1;
        userCampaigns[msg.sender].push(campaignId);

        emit CampaignCreated(
            campaignId,
            msg.sender,
            _beneficiary,
            _title,
            _goalAmount,
            deadline,
            _dbUuid
        );

        return campaignId;
    }

    /**
     * @dev Donate to a campaign
     * @param _campaignId ID of the campaign to donate to
     */
    function donate(uint256 _campaignId)
        external
        payable
        campaignExists(_campaignId)
        campaignActive(_campaignId)
        nonReentrant
    {
        require(msg.value > 0, "Donation must be greater than 0");

        Campaign storage campaign = campaigns[_campaignId];
        
        // Add donor to the list if this is their first contribution
        if (contributions[_campaignId][msg.sender] == 0) {
            campaignDonors[_campaignId].push(msg.sender);
        }
        
        // Track donation with timestamp for grace period
        donations[_campaignId][msg.sender] = Donation({
            amount: donations[_campaignId][msg.sender].amount + msg.value,
            timestamp: block.timestamp,
            refunded: false
        });
        
        contributions[_campaignId][msg.sender] += msg.value;
        campaign.totalRaised += msg.value;

        emit DonationReceived(_campaignId, msg.sender, msg.value);
    }
    
    /**
     * @dev Cancel donation within grace period (24 hours)
     * @param _campaignId ID of the campaign
     */
    function cancelDonation(uint256 _campaignId)
        external
        campaignExists(_campaignId)
        nonReentrant
    {
        Campaign storage campaign = campaigns[_campaignId];
        Donation storage donation = donations[_campaignId][msg.sender];
        
        require(!campaign.finalized, "Campaign already finalized");
        require(donation.amount > 0, "No donation found");
        require(!donation.refunded, "Donation already refunded");
        require(
            block.timestamp <= donation.timestamp + DONATION_GRACE_PERIOD,
            "Grace period expired"
        );
        
        uint256 refundAmount = donation.amount;
        donation.refunded = true;
        contributions[_campaignId][msg.sender] = 0;
        campaign.totalRaised -= refundAmount;
        
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");
        
        emit DonationCancelled(_campaignId, msg.sender, refundAmount);
    }

    /**
     * @dev Edit campaign title and description
     * @param _campaignId ID of the campaign to edit
     * @param _newTitle New campaign title
     * @param _newDescription New campaign description
     */
    function editCampaign(
        uint256 _campaignId,
        string memory _newTitle,
        string memory _newDescription
    ) external campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(
            msg.sender == campaign.creator,
            "Only campaign creator can edit"
        );
        require(!campaign.finalized, "Cannot edit finalized campaign");
        require(bytes(_newTitle).length > 0, "Title cannot be empty");
        
        campaign.title = _newTitle;
        campaign.description = _newDescription;
        
        emit CampaignEdited(_campaignId, _newTitle, _newDescription);
    }

    /**
     * @dev Finalize campaign and transfer funds to beneficiary
     * @param _campaignId ID of the campaign to finalize
     */
    function finalizeCampaign(uint256 _campaignId)
        external
        campaignExists(_campaignId)
        nonReentrant
    {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(!campaign.finalized, "Campaign already finalized");
        require(
            msg.sender == campaign.creator || msg.sender == owner(),
            "Only creator or owner can finalize"
        );
        
        bool goalReached = campaign.totalRaised >= campaign.goalAmount;
        
        // Allow finalization if deadline reached OR goal is fully met
        require(
            block.timestamp >= campaign.deadline || goalReached,
            "Campaign deadline not reached and goal not met"
        );

        campaign.finalized = true;

        if (goalReached && campaign.totalRaised > 0) {
            // Transfer funds to beneficiary
            (bool success, ) = campaign.beneficiary.call{value: campaign.totalRaised}("");
            require(success, "Transfer to beneficiary failed");
        } else if (!goalReached && campaign.totalRaised > 0) {
            // Enable refunds if goal not reached
            campaign.refundEnabled = true;
        }

        emit CampaignFinalized(_campaignId, campaign.totalRaised, goalReached);
    }

    /**
     * @dev Claim refund if campaign failed to reach goal
     * @param _campaignId ID of the campaign to claim refund from
     */
    function claimRefund(uint256 _campaignId)
        external
        campaignExists(_campaignId)
        nonReentrant
    {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.finalized, "Campaign not finalized");
        require(campaign.refundEnabled, "Refunds not enabled for this campaign");
        
        uint256 contributedAmount = contributions[_campaignId][msg.sender];
        require(contributedAmount > 0, "No contribution to refund");

        contributions[_campaignId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: contributedAmount}("");
        require(success, "Refund transfer failed");

        emit RefundIssued(_campaignId, msg.sender, contributedAmount);
    }
    
    /**
     * @dev Cancel campaign and enable refunds for all donors (creator only, before finalization)
     * @param _campaignId ID of the campaign to cancel
     */
    function cancelCampaign(uint256 _campaignId)
        external
        campaignExists(_campaignId)
        onlyCreatorOrOwner(_campaignId)
        nonReentrant
    {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(!campaign.finalized, "Cannot cancel finalized campaign");
        require(!campaign.cancelled, "Campaign already cancelled");
        
        campaign.cancelled = true;
        campaign.refundEnabled = true;
        
        uint256 totalToRefund = campaign.totalRaised;
        
        emit CampaignCancelled(_campaignId, msg.sender, totalToRefund);
    }
    
    /**
     * @dev Emergency pause campaign (owner only)
     * @param _campaignId ID of the campaign to pause
     */
    function pauseCampaign(uint256 _campaignId)
        external
        onlyOwner
        campaignExists(_campaignId)
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(!campaign.paused, "Campaign already paused");
        require(!campaign.finalized, "Cannot pause finalized campaign");
        
        campaign.paused = true;
        
        emit CampaignPaused(_campaignId, msg.sender);
    }
    
    /**
     * @dev Unpause campaign (owner only)
     * @param _campaignId ID of the campaign to unpause
     */
    function unpauseCampaign(uint256 _campaignId)
        external
        onlyOwner
        campaignExists(_campaignId)
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.paused, "Campaign not paused");
        
        campaign.paused = false;
        
        emit CampaignUnpaused(_campaignId, msg.sender);
    }

    /**
     * @dev Get campaign details
     * @param _campaignId ID of the campaign
     */
    function getCampaign(uint256 _campaignId)
        external
        view
        campaignExists(_campaignId)
        returns (
            address beneficiary,
            string memory title,
            string memory description,
            uint256 goalAmount,
            uint256 deadline,
            uint256 totalRaised,
            bool finalized,
            bool refundEnabled,
            address creator,
                string memory dbUuid,
            bool paused,
            bool cancelled,
            uint256 createdAt
        )
    {
        Campaign memory campaign = campaigns[_campaignId];
        return (
            campaign.beneficiary,
            campaign.title,
            campaign.description,
            campaign.goalAmount,
            campaign.deadline,
            campaign.totalRaised,
            campaign.finalized,
            campaign.refundEnabled,
            campaign.creator,
                campaign.dbUuid,
            campaign.paused,
            campaign.cancelled,
            campaign.createdAt
        );
    }

    /**
     * @dev Get total number of campaigns
     */
    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }

    /**
     * @dev Get contribution amount for a donor in a campaign
     * @param _campaignId Campaign ID
     * @param _donor Donor address
     */
    function getContribution(uint256 _campaignId, address _donor)
        external
        view
        returns (uint256)
    {
        return contributions[_campaignId][_donor];
    }

    /**
     * @dev Get all campaign IDs created by a user
     * @param _creator Creator address
     */
    function getUserCampaigns(address _creator)
        external
        view
        returns (uint256[] memory)
    {
        return userCampaigns[_creator];
    }

    /**
     * @dev Get top donors for a campaign (leaderboard)
     * @param _campaignId Campaign ID
     * @param _limit Maximum number of top donors to return
     */
    function getTopDonors(uint256 _campaignId, uint256 _limit)
        external
        view
        campaignExists(_campaignId)
        returns (address[] memory donors, uint256[] memory amounts)
    {
        address[] memory allDonors = campaignDonors[_campaignId];
        uint256 donorCount = allDonors.length;
        
        if (donorCount == 0) {
            return (new address[](0), new uint256[](0));
        }
        
        // Limit to actual donor count
        uint256 resultSize = donorCount < _limit ? donorCount : _limit;
        
        // Create temporary arrays for sorting
        address[] memory tempDonors = new address[](donorCount);
        uint256[] memory tempAmounts = new uint256[](donorCount);
        
        // Copy donors and their contributions
        for (uint256 i = 0; i < donorCount; i++) {
            tempDonors[i] = allDonors[i];
            tempAmounts[i] = contributions[_campaignId][allDonors[i]];
        }
        
        // Bubble sort (descending order by amount)
        for (uint256 i = 0; i < donorCount - 1; i++) {
            for (uint256 j = 0; j < donorCount - i - 1; j++) {
                if (tempAmounts[j] < tempAmounts[j + 1]) {
                    // Swap amounts
                    uint256 tempAmount = tempAmounts[j];
                    tempAmounts[j] = tempAmounts[j + 1];
                    tempAmounts[j + 1] = tempAmount;
                    
                    // Swap donors
                    address tempDonor = tempDonors[j];
                    tempDonors[j] = tempDonors[j + 1];
                    tempDonors[j + 1] = tempDonor;
                }
            }
        }
        
        // Return top N donors
        donors = new address[](resultSize);
        amounts = new uint256[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            donors[i] = tempDonors[i];
            amounts[i] = tempAmounts[i];
        }
        
        return (donors, amounts);
    }
}
