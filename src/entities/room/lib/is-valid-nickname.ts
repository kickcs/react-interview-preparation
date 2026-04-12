import { validateNickname } from "@/shared/contracts";

export function isValidNickname(raw: string): boolean {
  return validateNickname(raw).ok;
}
