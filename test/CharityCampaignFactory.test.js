const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CharityCampaignFactory", function () {
  let factory;
  let owner;
  let beneficiary;
  let donor1;
  let donor2;

  beforeEach(async function () {
    [owner, beneficiary, donor1, donor2] = await ethers.getSigners();

    const CharityCampaignFactory = await ethers.getContractFactory("CharityCampaignFactory");
    factory = await CharityCampaignFactory.deploy();
    await factory.waitForDeployment();
  });

  describe("Campaign Creation", function () {
    it("Should create a new campaign successfully", async function () {
      const tx = await factory.createCampaign(
        beneficiary.address,
        "Test Campaign",
        "This is a test campaign",
        ethers.parseEther("10"),
        30,
        "uuid-1" // dbUuid
      );

      const uuidKey = ethers.keccak256(ethers.toUtf8Bytes("uuid-1"));

      await expect(tx)
        .to.emit(factory, "CampaignCreated")
        .withArgs(uuidKey, owner.address, beneficiary.address, "Test Campaign", ethers.parseEther("10"), await time.latest() + 30 * 24 * 60 * 60, "uuid-1");

      const count = await factory.getCampaignCount();
      expect(count).to.equal(1);
    });

    it("Should reject campaign with invalid parameters", async function () {
      await expect(
        factory.createCampaign(ethers.ZeroAddress, "Test", "Description", ethers.parseEther("10"), 30, "uuid-err")
      ).to.be.revertedWith("Invalid beneficiary address");

      await expect(
        factory.createCampaign(beneficiary.address, "Test", "Description", 0, 30, "uuid-err")
      ).to.be.revertedWith("Goal amount too low");

      await expect(
        factory.createCampaign(beneficiary.address, "", "Description", ethers.parseEther("10"), 30, "uuid-err")
      ).to.be.revertedWith("Title cannot be empty");

      await expect(
        factory.createCampaign(beneficiary.address, "Test", "Description", ethers.parseEther("10"), 0, "uuid-err")
      ).to.be.revertedWith("Duration must be positive");
    });

    it("Should track user campaigns", async function () {
  await factory.createCampaign(beneficiary.address, "Campaign 1", "Description", ethers.parseEther("10"), 30, "uuid-1");

  await factory.createCampaign(beneficiary.address, "Campaign 2", "Description", ethers.parseEther("5"), 30, "uuid-2");

  const userCampaigns = await factory.getUserCampaigns(owner.address);
  expect(userCampaigns.length).to.equal(2);
  const key1 = ethers.keccak256(ethers.toUtf8Bytes("uuid-1"));
  const key2 = ethers.keccak256(ethers.toUtf8Bytes("uuid-2"));
  expect(userCampaigns[0]).to.equal(key1);
  expect(userCampaigns[1]).to.equal(key2);
    });
  });

  describe("Campaign Editing", function () {
    beforeEach(async function () {
      // Create a test campaign
      await factory.createCampaign(beneficiary.address, "Original Title", "Original Description", ethers.parseEther("10"), 30, "uuid-1");
    });

    it("Should allow creator to edit campaign title and description", async function () {
      const tx = await factory.editCampaign(
        "uuid-1",
        "Updated Title",
        "Updated Description"
      );

      const uuidKey = ethers.keccak256(ethers.toUtf8Bytes("uuid-1"));

      await expect(tx)
        .to.emit(factory, "CampaignEdited")
        .withArgs(uuidKey, "Updated Title", "Updated Description");

      const campaign = await factory.getCampaign("uuid-1");
      expect(campaign.title).to.equal("Updated Title");
      expect(campaign.description).to.equal("Updated Description");
    });

    it("Should reject edit from non-creator", async function () {
      await expect(
        factory.connect(donor1).editCampaign(
          "uuid-1",
          "Hacked Title",
          "Hacked Description"
        )
      ).to.be.revertedWith("Only campaign creator can edit");
    });

    it("Should reject empty title", async function () {
      await expect(
        factory.editCampaign("uuid-1", "", "New Description")
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should reject editing finalized campaign", async function () {
      // Fast forward past deadline
      await time.increase(31 * 24 * 60 * 60);
      
      // Finalize the campaign
      await factory.finalizeCampaign("uuid-1");

      await expect(
        factory.editCampaign("uuid-1", "New Title", "New Description")
      ).to.be.revertedWith("Cannot edit finalized campaign");
    });

    it("Should reject editing non-existent campaign", async function () {
      await expect(
        factory.editCampaign("non-existent-uuid", "Title", "Description")
      ).to.be.revertedWith("Campaign does not exist");
    });

    it("Should allow editing with donations already received", async function () {
  // Make a donation first
  await factory.connect(donor1).donate("uuid-1", { value: ethers.parseEther("1") });

      // Should still be able to edit
      const tx = await factory.editCampaign(
        "uuid-1",
        "Updated After Donation",
        "Updated Description"
      );

      const uuidKey = ethers.keccak256(ethers.toUtf8Bytes("uuid-1"));

      await expect(tx)
        .to.emit(factory, "CampaignEdited")
        .withArgs(uuidKey, "Updated After Donation", "Updated Description");

      // Verify donation is still recorded
      const contribution = await factory.getContribution("uuid-1", donor1.address);
      expect(contribution).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Donations", function () {
    beforeEach(async function () {
  await factory.createCampaign(beneficiary.address, "Test Campaign", "Description", ethers.parseEther("10"), 30, "uuid-1");
    });

    it("Should accept donations", async function () {
      const donationAmount = ethers.parseEther("1");

      const uuidKey = ethers.keccak256(ethers.toUtf8Bytes("uuid-1"));

      await expect(factory.connect(donor1).donate("uuid-1", { value: donationAmount }))
        .to.emit(factory, "DonationReceived")
        .withArgs(uuidKey, donor1.address, donationAmount);

      const campaign = await factory.getCampaign("uuid-1");
      expect(campaign.totalRaised).to.equal(donationAmount);

      const contribution = await factory.getContribution("uuid-1", donor1.address);
      expect(contribution).to.equal(donationAmount);
    });

    it("Should accept multiple donations from same donor", async function () {
      await factory.connect(donor1).donate("uuid-1", { value: ethers.parseEther("1") });
      await factory.connect(donor1).donate("uuid-1", { value: ethers.parseEther("2") });

      const contribution = await factory.getContribution("uuid-1", donor1.address);
      expect(contribution).to.equal(ethers.parseEther("3"));
    });

    it("Should reject zero donations", async function () {
      await expect(
        factory.connect(donor1).donate("uuid-1", { value: 0 })
      ).to.be.revertedWith("Donation must be greater than 0");
    });

    it("Should reject donations to non-existent campaign", async function () {
      await expect(
        factory.connect(donor1).donate("non-existent-uuid", { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign does not exist");
    });

    it("Should reject donations after deadline", async function () {
      await time.increase(31 * 24 * 60 * 60); // Move past 30 day deadline

      await expect(
        factory.connect(donor1).donate("uuid-1", { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign deadline passed");
    });

    it("Should reject donations to finalized campaign", async function () {
      await time.increase(31 * 24 * 60 * 60);
      await factory.finalizeCampaign("uuid-1");

      await expect(
        factory.connect(donor1).donate("uuid-1", { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign already finalized");
    });
  });

  describe("Campaign Finalization", function () {
    beforeEach(async function () {
  await factory.createCampaign(beneficiary.address, "Test Campaign", "Description", ethers.parseEther("10"), 30, "uuid-1");
    });

    it("Should finalize successful campaign and transfer funds", async function () {
      const donationAmount = ethers.parseEther("12");
      await factory.connect(donor1).donate("uuid-1", { value: donationAmount });

      const beneficiaryBalanceBefore = await ethers.provider.getBalance(beneficiary.address);

      await time.increase(31 * 24 * 60 * 60);
      
      const tx = await factory.finalizeCampaign("uuid-1");
      const uuidKey = ethers.keccak256(ethers.toUtf8Bytes("uuid-1"));
      await expect(tx)
        .to.emit(factory, "CampaignFinalized")
        .withArgs(uuidKey, donationAmount, true);

      const beneficiaryBalanceAfter = await ethers.provider.getBalance(beneficiary.address);
      expect(beneficiaryBalanceAfter - beneficiaryBalanceBefore).to.equal(donationAmount);

      const campaign = await factory.getCampaign("uuid-1");
      expect(campaign.finalized).to.be.true;
      expect(campaign.refundEnabled).to.be.false;
    });

    it("Should enable refunds for failed campaign", async function () {
      const donationAmount = ethers.parseEther("5"); // Less than goal
      await factory.connect(donor1).donate("uuid-1", { value: donationAmount });

      await time.increase(31 * 24 * 60 * 60);
      
      await factory.finalizeCampaign("uuid-1");

      const campaign = await factory.getCampaign("uuid-1");
      expect(campaign.finalized).to.be.true;
      expect(campaign.refundEnabled).to.be.true;
    });

    it("Should reject finalization before deadline and goal not met", async function () {
      await expect(
        factory.finalizeCampaign("uuid-1")
      ).to.be.revertedWith("Campaign deadline not reached and goal not met");
    });

    it("Should allow finalization when goal is fully met before deadline", async function () {
      // Create a campaign with 1 ETH goal
  await factory.createCampaign(beneficiary.address, "Fully Funded Campaign", "Should finalize immediately when goal met", ethers.parseEther("1"), 30, "uuid-2");

      // Get beneficiary balance before donation
      const balanceBefore = await ethers.provider.getBalance(beneficiary.address);

      // Donate exactly the goal amount
      await factory.connect(donor1).donate("uuid-2", {
        value: ethers.parseEther("1")
      });

      // Should be able to finalize immediately (before deadline)
      await expect(factory.finalizeCampaign("uuid-2")).to.not.be.reverted;

      const campaign = await factory.getCampaign("uuid-2");
      expect(campaign.finalized).to.be.true;
      
      // Funds should be transferred to beneficiary
      const balanceAfter = await ethers.provider.getBalance(beneficiary.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1"));
    });

    it("Should reject finalization by unauthorized user", async function () {
      await time.increase(31 * 24 * 60 * 60);

      await expect(
        factory.connect(donor1).finalizeCampaign("uuid-1")
      ).to.be.revertedWith("Only creator or owner can finalize");
    });

    it("Should allow owner to finalize any campaign", async function () {
      await time.increase(31 * 24 * 60 * 60);
      await expect(factory.connect(owner).finalizeCampaign("uuid-1")).to.not.be.reverted;
    });

    it("Should prevent double finalization", async function () {
      await time.increase(31 * 24 * 60 * 60);
      await factory.finalizeCampaign("uuid-1");

      await expect(
        factory.finalizeCampaign("uuid-1")
      ).to.be.revertedWith("Campaign already finalized");
    });
  });

  describe("Refunds", function () {
    beforeEach(async function () {
  await factory.createCampaign(beneficiary.address, "Test Campaign", "Description", ethers.parseEther("10"), 30, "uuid-1");
    });

    it("Should process refunds for failed campaign", async function () {
      const donationAmount = ethers.parseEther("3");
      await factory.connect(donor1).donate("uuid-1", { value: donationAmount });

      await time.increase(31 * 24 * 60 * 60);
      await factory.finalizeCampaign("uuid-1");

      const balanceBefore = await ethers.provider.getBalance(donor1.address);
      
      const tx = await factory.connect(donor1).claimRefund("uuid-1");
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const uuidKey = ethers.keccak256(ethers.toUtf8Bytes("uuid-1"));
      await expect(tx)
        .to.emit(factory, "RefundIssued")
        .withArgs(uuidKey, donor1.address, donationAmount);

      const balanceAfter = await ethers.provider.getBalance(donor1.address);
      expect(balanceAfter - balanceBefore + gasUsed).to.equal(donationAmount);

      // Should not allow claiming twice
      await expect(
        factory.connect(donor1).claimRefund("uuid-1")
      ).to.be.revertedWith("No contribution to refund");
    });

    it("Should reject refunds for successful campaign", async function () {
      await factory.connect(donor1).donate("uuid-1", { value: ethers.parseEther("12") });

      await time.increase(31 * 24 * 60 * 60);
      await factory.finalizeCampaign("uuid-1");

      await expect(
        factory.connect(donor1).claimRefund("uuid-1")
      ).to.be.revertedWith("Refunds not enabled for this campaign");
    });

    it("Should reject refunds for non-contributors", async function () {
      await factory.connect(donor1).donate("uuid-1", { value: ethers.parseEther("3") });

      await time.increase(31 * 24 * 60 * 60);
      await factory.finalizeCampaign("uuid-1");

      await expect(
        factory.connect(donor2).claimRefund("uuid-1")
      ).to.be.revertedWith("No contribution to refund");
    });

    it("Should reject refunds before finalization", async function () {
      await factory.connect(donor1).donate("uuid-1", { value: ethers.parseEther("3") });

      await expect(
        factory.connect(donor1).claimRefund("uuid-1")
      ).to.be.revertedWith("Campaign not finalized");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await factory.createCampaign(beneficiary.address, "Test Campaign", "Test Description", ethers.parseEther("10"), 30, "uuid-1");
    });

    it("Should return correct campaign details", async function () {
  const campaign = await factory.getCampaign("uuid-1");
      
      expect(campaign.beneficiary).to.equal(beneficiary.address);
      expect(campaign.title).to.equal("Test Campaign");
      expect(campaign.description).to.equal("Test Description");
      expect(campaign.goalAmount).to.equal(ethers.parseEther("10"));
      expect(campaign.totalRaised).to.equal(0);
      expect(campaign.finalized).to.be.false;
      expect(campaign.refundEnabled).to.be.false;
      expect(campaign.creator).to.equal(owner.address);
    });

    it("Should return correct campaign count", async function () {
  await factory.createCampaign(beneficiary.address, "Campaign 2", "Description 2", ethers.parseEther("5"), 30, "uuid-2");

      const count = await factory.getCampaignCount();
      expect(count).to.equal(2);
    });

    it("Should return correct contribution amount", async function () {
      await factory.connect(donor1).donate("uuid-1", { value: ethers.parseEther("2") });
      
      const contribution = await factory.getContribution("uuid-1", donor1.address);
      expect(contribution).to.equal(ethers.parseEther("2"));
    });
  });
});
