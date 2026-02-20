// utils/premiumPlacement.ts
// Premium placement algorithm for contractor listings

import { Contractor } from "../types/home";

export type PlacementTier = "CITY_FIRST" | "PROFESSION_FIRST" | "TOP_FIVE";

/**
 * Applies premium placement logic to a list of contractors
 * @param contractors Array of contractors
 * @param searchProfession Optional profession filter for PROFESSION_FIRST tier
 * @param searchCity Optional city filter for CITY_FIRST tier
 * @returns Reordered contractors with premium placement applied
 */
export function applyPremiumPlacement(
  contractors: Contractor[],
  searchProfession?: string[],
  searchCity?: string
): Contractor[] {
  if (!contractors.length) return contractors;

  // Filter contractors with active premium placement
  const premiumContractors = contractors.filter((contractor) => {
    const isActive =
      contractor.premiumPlacement &&
      contractor.placementTier &&
      (!contractor.placementExpiresAt ||
        new Date(contractor.placementExpiresAt) > new Date());

    return isActive;
  });

  // Create placement array - exactly 8 slots for first row
  const firstRow: (Contractor | null)[] = new Array(8).fill(null);
  const usedContractors = new Set<number>();

  // Step 1: Place contractors with specific selected positions
  premiumContractors.forEach((contractor) => {
    if (
      contractor.selectedPosition &&
      contractor.selectedPosition >= 1 &&
      contractor.selectedPosition <= 8
    ) {
      const position = contractor.selectedPosition - 1; // Convert to 0-based index

      // Check placement rules
      let canPlace = false;

      switch (contractor.placementTier) {
        case "CITY_FIRST":
          // City Champion can only be placed if city matches or no city filter
          canPlace =
            !searchCity ||
            contractor.city?.toLowerCase().includes(searchCity.toLowerCase());
          break;
        case "PROFESSION_FIRST":
          // Profession Leader can only be placed if profession matches or no profession filter
          canPlace =
            !searchProfession ||
            searchProfession.length === 0 ||
            searchProfession.some((prof) =>
              contractor.specializations?.some(
                (spec) =>
                  spec.toLowerCase().includes(prof.toLowerCase()) ||
                  prof.toLowerCase().includes(spec.toLowerCase())
              )
            );
          break;
        case "TOP_FIVE":
          // Top 5 can always be placed in available positions
          canPlace = true;
          break;
        default:
          canPlace = false;
      }

      if (canPlace && firstRow[position] === null) {
        firstRow[position] = contractor;
        usedContractors.add(contractor.id);
      }
    }
  });

  // Step 2: Place remaining premium contractors in their tier-specific positions
  premiumContractors.forEach((contractor) => {
    if (usedContractors.has(contractor.id)) return; // Already placed

    const { placementTier, specializations = [], city } = contractor;
    let placed = false;

    switch (placementTier) {
      case "CITY_FIRST":
        // City Champion gets position 5 (index 4) if available and city matches
        if (
          firstRow[4] === null &&
          (!searchCity ||
            city?.toLowerCase().includes(searchCity.toLowerCase()))
        ) {
          firstRow[4] = contractor;
          usedContractors.add(contractor.id);
          placed = true;
        }
        break;

      case "PROFESSION_FIRST":
        // Profession Leader gets positions 4 or 6 (indexes 3 or 5) if profession matches
        const matchesProfession =
          !searchProfession ||
          searchProfession.length === 0 ||
          searchProfession.some((prof) =>
            specializations.some(
              (spec) =>
                spec.toLowerCase().includes(prof.toLowerCase()) ||
                prof.toLowerCase().includes(spec.toLowerCase())
            )
          );

        if (matchesProfession) {
          if (firstRow[3] === null) {
            firstRow[3] = contractor;
            usedContractors.add(contractor.id);
            placed = true;
          } else if (firstRow[5] === null) {
            firstRow[5] = contractor;
            usedContractors.add(contractor.id);
            placed = true;
          }
        }
        break;

      case "TOP_FIVE":
        // Top 5 gets positions 1, 2, 3, 7, 8 (indexes 0, 1, 2, 6, 7) if available
        const topFivePositions = [0, 1, 2, 6, 7];
        for (const position of topFivePositions) {
          if (firstRow[position] === null) {
            firstRow[position] = contractor;
            usedContractors.add(contractor.id);
            placed = true;
            break;
          }
        }
        break;
    }
  });

  // Step 3: Fill remaining slots with non-premium contractors
  const nonPremiumContractors = contractors.filter(
    (contractor) => !usedContractors.has(contractor.id)
  );

  let nonPremiumIndex = 0;
  for (let i = 0; i < 8; i++) {
    if (
      firstRow[i] === null &&
      nonPremiumIndex < nonPremiumContractors.length
    ) {
      firstRow[i] = nonPremiumContractors[nonPremiumIndex];
      nonPremiumIndex++;
    }
  }

  // Build final result: first row + remaining contractors
  const result: Contractor[] = [];

  // Add first row (filter out nulls)
  firstRow.forEach((contractor) => {
    if (contractor) result.push(contractor);
  });

  // Add remaining non-premium contractors
  for (let i = nonPremiumIndex; i < nonPremiumContractors.length; i++) {
    result.push(nonPremiumContractors[i]);
  }

  return result;
}

/**
 * Determines if a contractor's premium placement is still active
 */
export function isPremiumPlacementActive(contractor: Contractor): boolean {
  return !!(
    contractor.premiumPlacement &&
    contractor.placementTier &&
    contractor.placementExpiresAt &&
    new Date(contractor.placementExpiresAt) > new Date()
  );
}
