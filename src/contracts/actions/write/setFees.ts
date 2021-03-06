import { PstAction, ArNSState, ContractResult } from "../../types/types";
import { MAX_NAME_LENGTH } from "@/constants";
declare const ContractError;

// Modifies the fees for purchasing ArNS names
export const setFees = async (
  state: ArNSState,
  { caller, input: { fees } }: PstAction
): Promise<ContractResult> => {
  const owner = state.owner;

  // Only the owner of the contract can perform this method
  if (caller !== owner) {
    throw new ContractError("Caller cannot change fees");
  }

  // Check there are the right amount of fees in the object
  if (Object.keys(fees).length !== MAX_NAME_LENGTH) {
    throw new ContractError('Invalid number of fees being set. There must be fees set for all %s characters that can be purchased', MAX_NAME_LENGTH);
  }

  // check validity of fee object
  for (let i = 1; i <= MAX_NAME_LENGTH; i ++) {
    if (!Number.isInteger(fees[i.toString()]) || fees[i.toString()] <= 0) {
      throw new ContractError('Invalid value for fee %s. Must be an integer greater than 0', i);
    }
  }

  state.fees = fees;

  return { state };
};
