export const getProgressPercentage = (raised, goal) => {
  return Math.min((parseFloat(raised) / parseFloat(goal)) * 100, 100).toFixed(1);
};

export const isDeadlinePassed = (deadline, blockchainTime = null) => {
  const currentTime = blockchainTime ? new Date(blockchainTime * 1000) : new Date();
  return currentTime > deadline;
};

export const canFinalizeCampaign = (campaign, blockchainTime = null) => {
  const deadlinePassed = isDeadlinePassed(campaign.deadline, blockchainTime);
  const goalReached = parseFloat(campaign.totalRaised) >= parseFloat(campaign.goalAmount);
  return deadlinePassed || goalReached;
};
