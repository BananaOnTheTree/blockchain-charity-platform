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
        string dbUuid; // Database UUID for off-chain metadata (readable)
        bool paused; // Emergency pause by owner
        bool cancelled; // Cancelled by creator
        uint256 createdAt; // Campaign creation timestamp
    }
    
    struct Donation {
        uint256 amount;
        uint256 timestamp;
        bool refunded;
    }

    // Keyed by keccak256(abi.encodePacked(dbUuid))
    mapping(bytes32 => Campaign) private campaigns;
    mapping(bytes32 => mapping(address => uint256)) public contributions;
    mapping(bytes32 => mapping(address => Donation)) public donations; // Track individual donations with timestamp
    mapping(address => bytes32[]) public userCampaigns;
    mapping(bytes32 => address[]) public campaignDonors;
    // Enumeration and existence
    bytes32[] public campaignKeys;
    mapping(bytes32 => bool) public uuidExists;

    event CampaignCreated(
        bytes32 indexed uuidKey,
        address indexed creator,
        address indexed beneficiary,
        string title,
        uint256 goalAmount,
        uint256 deadline,
        string dbUuid
    );

    event DonationReceived(
        bytes32 indexed uuidKey,
        address indexed donor,
        uint256 amount
    );

    event CampaignFinalized(
        bytes32 indexed uuidKey,
        uint256 totalRaised,
        bool goalReached
    );

    event RefundIssued(
        bytes32 indexed uuidKey,
        address indexed donor,
        uint256 amount
    );

    // Debug/event to help trace beneficiary balance changes on finalize
    event BeneficiaryBalanceChanged(
        bytes32 indexed uuidKey,
        address indexed beneficiary,
        uint256 balanceBefore,
        uint256 balanceAfter
    );

    event CampaignEdited(
        bytes32 indexed uuidKey,
        string newTitle,
        string newDescription
    );
    
    event CampaignPaused(
        bytes32 indexed uuidKey,
        address indexed admin
    );
    
    event CampaignUnpaused(
        bytes32 indexed uuidKey,
        address indexed admin
    );
    
    event CampaignCancelled(
        bytes32 indexed uuidKey,
        address indexed creator,
        uint256 totalRefunded
    );
    
    event DonationCancelled(
        bytes32 indexed uuidKey,
        address indexed donor,
        uint256 amount
    );

    modifier campaignExists(bytes32 _uuidKey) {
        require(uuidExists[_uuidKey], "Campaign does not exist");
        _;
    }

    modifier campaignActive(bytes32 _uuidKey) {
        Campaign memory campaign = campaigns[_uuidKey];
        require(!campaign.finalized, "Campaign already finalized");
        require(!campaign.paused, "Campaign is paused");
        require(!campaign.cancelled, "Campaign has been cancelled");
        require(block.timestamp < campaign.deadline, "Campaign deadline passed");
        _;
    }
    
    modifier onlyCreatorOrOwner(bytes32 _uuidKey) {
        Campaign memory campaign = campaigns[_uuidKey];
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
    ) external returns (bytes32) {
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

        bytes32 uuidKey = keccak256(abi.encodePacked(_dbUuid));
        require(!uuidExists[uuidKey], "UUID already used");

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

        campaigns[uuidKey] = newCampaign;
        userCampaigns[msg.sender].push(uuidKey);
        campaignKeys.push(uuidKey);
        uuidExists[uuidKey] = true;

        emit CampaignCreated(
            uuidKey,
            msg.sender,
            _beneficiary,
            _title,
            _goalAmount,
            deadline,
            _dbUuid
        );

        return uuidKey;
    }

    /**
     * @dev Helper to compute the bytes32 key for a UUID string
     */
    function _toUuidKey(string memory _dbUuid) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_dbUuid));
    }

    /**
     * @dev Donate to a campaign
     * @param _dbUuid Database UUID of the campaign to donate to
     */
    function donate(string memory _dbUuid)
        external
        payable
        nonReentrant
    {
    bytes32 uuidKey = _toUuidKey(_dbUuid);
    require(uuidExists[uuidKey], "Campaign does not exist");
    Campaign storage campaign = campaigns[uuidKey];
    require(!campaign.finalized, "Campaign already finalized");
    require(!campaign.paused, "Campaign is paused");
    require(!campaign.cancelled, "Campaign has been cancelled");
    require(block.timestamp < campaign.deadline, "Campaign deadline passed");

    require(msg.value > 0, "Donation must be greater than 0");

        // Add donor to the list if this is their first contribution
        if (contributions[uuidKey][msg.sender] == 0) {
            campaignDonors[uuidKey].push(msg.sender);
        }

        // Track donation with timestamp for grace period
        donations[uuidKey][msg.sender] = Donation({
            amount: donations[uuidKey][msg.sender].amount + msg.value,
            timestamp: block.timestamp,
            refunded: false
        });

        contributions[uuidKey][msg.sender] += msg.value;
        campaign.totalRaised += msg.value;

        emit DonationReceived(uuidKey, msg.sender, msg.value);
    }
    
    /**
     * @dev Cancel donation within grace period (24 hours)
     * @param _dbUuid Database UUID of the campaign
     */
    function cancelDonation(string memory _dbUuid)
        external
        nonReentrant
    {
    bytes32 uuidKey = _toUuidKey(_dbUuid);
        require(uuidExists[uuidKey], "Campaign does not exist");

        Campaign storage campaign = campaigns[uuidKey];
        Donation storage donation = donations[uuidKey][msg.sender];
        
        require(!campaign.finalized, "Campaign already finalized");
        require(donation.amount > 0, "No donation found");
        require(!donation.refunded, "Donation already refunded");
        require(
            block.timestamp <= donation.timestamp + DONATION_GRACE_PERIOD,
            "Grace period expired"
        );
        
        uint256 refundAmount = donation.amount;
        donation.refunded = true;
        contributions[uuidKey][msg.sender] = 0;
        campaign.totalRaised -= refundAmount;
        
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");
        
        emit DonationCancelled(uuidKey, msg.sender, refundAmount);
    }

    /**
     * @dev Edit campaign title and description
     * @param _dbUuid Database UUID of the campaign to edit
     * @param _newTitle New campaign title
     * @param _newDescription New campaign description
     */
    function editCampaign(
        string memory _dbUuid,
        string memory _newTitle,
        string memory _newDescription
    ) external {
    bytes32 uuidKey = _toUuidKey(_dbUuid);
        require(uuidExists[uuidKey], "Campaign does not exist");

        Campaign storage campaign = campaigns[uuidKey];
        
        require(
            msg.sender == campaign.creator,
            "Only campaign creator can edit"
        );
        require(!campaign.finalized, "Cannot edit finalized campaign");
        require(bytes(_newTitle).length > 0, "Title cannot be empty");
        
        campaign.title = _newTitle;
        campaign.description = _newDescription;
        
        emit CampaignEdited(uuidKey, _newTitle, _newDescription);
    }

    /**
     * @dev Finalize campaign and transfer funds to beneficiary
     * @param _dbUuid Database UUID of the campaign to finalize
     */
    function finalizeCampaign(string memory _dbUuid)
        external
        nonReentrant
    {
    bytes32 uuidKey = _toUuidKey(_dbUuid);
        require(uuidExists[uuidKey], "Campaign does not exist");

        Campaign storage campaign = campaigns[uuidKey];
        
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
            uint256 balanceBefore = campaign.beneficiary.balance;
            (bool success, ) = campaign.beneficiary.call{value: campaign.totalRaised}("");
            require(success, "Transfer to beneficiary failed");
            uint256 balanceAfter = campaign.beneficiary.balance;
            emit BeneficiaryBalanceChanged(uuidKey, campaign.beneficiary, balanceBefore, balanceAfter);
        } else if (!goalReached && campaign.totalRaised > 0) {
            // Enable refunds if goal not reached
            campaign.refundEnabled = true;
        }

        emit CampaignFinalized(uuidKey, campaign.totalRaised, goalReached);
    }

    /**
     * @dev Claim refund if campaign failed to reach goal
     * @param _dbUuid Database UUID of the campaign to claim refund from
     */
    function claimRefund(string memory _dbUuid)
        external
        nonReentrant
    {
    bytes32 uuidKey = _toUuidKey(_dbUuid);
        require(uuidExists[uuidKey], "Campaign does not exist");
        
        Campaign storage campaign = campaigns[uuidKey];
        
        require(campaign.finalized, "Campaign not finalized");
        require(campaign.refundEnabled, "Refunds not enabled for this campaign");
        
        uint256 contributedAmount = contributions[uuidKey][msg.sender];
        require(contributedAmount > 0, "No contribution to refund");

        contributions[uuidKey][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: contributedAmount}("");
        require(success, "Refund transfer failed");

        emit RefundIssued(uuidKey, msg.sender, contributedAmount);
    }
    
    /**
     * @dev Cancel campaign and enable refunds for all donors (creator only, before finalization)
     * @param _dbUuid Database UUID of the campaign to cancel
     */
    function cancelCampaign(string memory _dbUuid)
        external
        onlyCreatorOrOwner(_toUuidKey(_dbUuid))
        nonReentrant
    {
        bytes32 uuidKey = _toUuidKey(_dbUuid);
        require(uuidExists[uuidKey], "Campaign does not exist");
        
        Campaign storage campaign = campaigns[uuidKey];
        
        require(!campaign.finalized, "Cannot cancel finalized campaign");
        require(!campaign.cancelled, "Campaign already cancelled");
        
        campaign.cancelled = true;
        campaign.refundEnabled = true;
        
        uint256 totalToRefund = campaign.totalRaised;
        
        emit CampaignCancelled(uuidKey, msg.sender, totalToRefund);
    }
    
    /**
     * @dev Emergency pause campaign (owner only)
     * @param _dbUuid Database UUID of the campaign to pause
     */
    function pauseCampaign(string memory _dbUuid)
        external
        onlyOwner
    {
    bytes32 uuidKey = _toUuidKey(_dbUuid);
        require(uuidExists[uuidKey], "Campaign does not exist");

        Campaign storage campaign = campaigns[uuidKey];
        require(!campaign.paused, "Campaign already paused");
        require(!campaign.finalized, "Cannot pause finalized campaign");
        
        campaign.paused = true;
        
        emit CampaignPaused(uuidKey, msg.sender);
    }
    
    /**
     * @dev Unpause campaign (owner only)
     * @param _dbUuid Database UUID of the campaign to unpause
     */
    function unpauseCampaign(string memory _dbUuid)
        external
        onlyOwner
    {
    bytes32 uuidKey = _toUuidKey(_dbUuid);
        require(uuidExists[uuidKey], "Campaign does not exist");

        Campaign storage campaign = campaigns[uuidKey];
        require(campaign.paused, "Campaign not paused");
        
        campaign.paused = false;
        
        emit CampaignUnpaused(uuidKey, msg.sender);
    }

    /**
     * @dev Get campaign details
     * @param _dbUuid Database UUID of the campaign
     */
    function getCampaign(string memory _dbUuid)
        external
        view
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
    bytes32 uuidKey = _toUuidKey(_dbUuid);
        require(uuidExists[uuidKey], "Campaign does not exist");

        Campaign memory campaign = campaigns[uuidKey];
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
     * @dev Get campaign details by bytes32 key (on-chain enumeration friendly)
     * @param _uuidKey bytes32 keccak256 hash of the DB UUID string
     */
    function getCampaignByKey(bytes32 _uuidKey)
        external
        view
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
        require(uuidExists[_uuidKey], "Campaign does not exist");
        Campaign memory campaign = campaigns[_uuidKey];
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
        return campaignKeys.length;
    }

    /**
     * @dev Get contribution amount for a donor in a campaign
     * @param _dbUuid Database UUID of the campaign
     * @param _donor Donor address
     */
    function getContribution(string memory _dbUuid, address _donor)
        external
        view
        returns (uint256)
    {
    bytes32 uuidKey = _toUuidKey(_dbUuid);
        require(uuidExists[uuidKey], "Campaign does not exist");
        return contributions[uuidKey][_donor];
    }

    /**
     * @dev Get all campaign UUIDs created by a user
     * @param _creator Creator address
     */
    function getUserCampaigns(address _creator)
        external
        view
        returns (bytes32[] memory)
    {
        return userCampaigns[_creator];
    }

    /**
     * @dev Get top donors for a campaign (leaderboard)
     * @param _dbUuid Database UUID of the campaign
     * @param _limit Maximum number of top donors to return
     */
    function getTopDonors(string memory _dbUuid, uint256 _limit)
        external
        view
        returns (address[] memory donors, uint256[] memory amounts)
    {
    bytes32 uuidKey = _toUuidKey(_dbUuid);
        require(uuidExists[uuidKey], "Campaign does not exist");

        address[] memory allDonors = campaignDonors[uuidKey];
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
            tempAmounts[i] = contributions[uuidKey][allDonors[i]];
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
