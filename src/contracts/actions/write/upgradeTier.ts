import { SECONDS_IN_A_YEAR, SECONDS_IN_GRACE_PERIOD } from "@/constants";
import { PstAction, ArNSState, ContractResult } from "../../types/types";

declare const ContractError;
declare const SmartWeave: any;

export const upgradeTier = async (
  state: ArNSState,
  { caller, input: { name, tier } }: PstAction
): Promise<ContractResult> => {
  const balances = state.balances;
  const records = state.records;
  const fees = state.fees;
  const tiers = state.tiers;
  const currentBlockTime = +SmartWeave.block.timestamp;

  // Check if the user has enough tokens to upgrade the tier
  if (!balances[caller]) {
    throw new ContractError(`Caller balance is not defined!`);
  }

  // check if record exists
  if (!records[name]) {
    throw new ContractError(`No record exists with this name ${name}`);
  }

  // check if the record is purchased, if not it must be purchased first
  if (records[name].endTimestamp + SECONDS_IN_GRACE_PERIOD < currentBlockTime) {
    throw new ContractError(`This record ${name} needs to be purchased first`);
  }

  // Check if it includes a valid tier number
  if (!Number.isInteger(tier)) {
    throw new ContractError('Invalid value for "tier". Must be an integers');
  }

  // Check if this is a valid tier
  if (!tiers[tier]) {
    throw new ContractError(`Tier is not defined!`);
  }

  if (tier <= records[name].tier) {
    throw new ContractError(`Tiers can only be upgraded, not lowered!`);
  }

  // Determine price of upgrading this tier, prorating based on current time and amount of tiers left
  let amountOfSecondsLeft = records[name].endTimestamp - currentBlockTime;
  let amountOfYearsLeft = amountOfSecondsLeft / SECONDS_IN_A_YEAR;
  let levelsUpgraded = tier - records[name].tier;

  // The price is determined by multiplying the base fee times the number of levels upgraded times the amount of years left
  let qty = Math.ceil(
    fees[name.length.toString()] * levelsUpgraded * amountOfYearsLeft
  );
  console.log(
    `This costs ${qty} to upgrade ${name} to tier ${tier} for ${amountOfYearsLeft} years`
  );

  // Check if the caller has enough tokens to upgrade this tier
  if (balances[caller] < qty) {
    throw new ContractError(
      `Caller balance not high enough to extend this name lease for ${qty} token(s)!`
    );
  }

  // reduce balance set the end lease period for this record based on number of years
  balances[caller] -= qty;

  // Set the maximum amount of subdomains for this name based on the selected tier
  records[name].tier = tier;
  records[name].maxSubdomains = tiers[tier].maxSubdomains;

  return { state };
};