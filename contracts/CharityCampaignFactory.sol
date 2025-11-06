// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CharityCampaignFactory
 * @dev Factory contract to create and manage charity campaigns
 */
contract CharityCampaignFactory is Ownable, ReentrancyGuard {
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
    }

    Campaign[] public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(address => uint256[]) public userCampaigns;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        address indexed beneficiary,
        string title,
        uint256 goalAmount,
        uint256 deadline
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

    modifier campaignExists(uint256 _campaignId) {
        require(_campaignId < campaigns.length, "Campaign does not exist");
        _;
    }

    modifier campaignActive(uint256 _campaignId) {
        Campaign memory campaign = campaigns[_campaignId];
        require(!campaign.finalized, "Campaign already finalized");
        require(block.timestamp < campaign.deadline, "Campaign deadline passed");
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
     */
    function createCampaign(
        address payable _beneficiary,
        string memory _title,
        string memory _description,
        uint256 _goalAmount,
        uint256 _durationDays
    ) external returns (uint256) {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(_goalAmount > 0, "Goal amount must be greater than 0");
        require(_durationDays > 0 && _durationDays <= 365, "Invalid duration");
        require(bytes(_title).length > 0, "Title cannot be empty");

        uint256 deadline = block.timestamp + (_durationDays * 1 days);

        Campaign memory newCampaign = Campaign({
            beneficiary: _beneficiary,
            title: _title,
            description: _description,
            goalAmount: _goalAmount,
            deadline: deadline,
            totalRaised: 0,
            finalized: false,
            refundEnabled: false,
            creator: msg.sender
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
            deadline
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
        
        contributions[_campaignId][msg.sender] += msg.value;
        campaign.totalRaised += msg.value;

        emit DonationReceived(_campaignId, msg.sender, msg.value);
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
        require(
            block.timestamp >= campaign.deadline,
            "Campaign deadline not reached"
        );

        campaign.finalized = true;
        bool goalReached = campaign.totalRaised >= campaign.goalAmount;

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
            address creator
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
            campaign.creator
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
}
