import type { BoardCell } from '../types';
import type {
  HarvestState,
  SeedsState,
  UpgradeState,
} from '../components/UpgradeList';

/** Per-garden progression: economy, board, upgrades, goals, discovery, collection mastery for that garden. */
export interface GardenState {
  pendingOfflineEarnings: number;
  money: number;
  grid: BoardCell[];
  seedProgress: number;
  harvestProgress: number;
  harvestCharges: number;
  seedsState: SeedsState;
  harvestState: HarvestState;
  cropsState: Record<string, UpgradeState>;
  seedsInStorage: number;
  highestPlantEver: number;
  playerLevel: number;
  playerLevelProgress: number;
  plantMasteryGoalsCompleted: number;
  plantMasteryOrdersProgress: number;
  plantMasteryTargetLevel: number;
  plantMasteryUnlockPending: number[];
  plantMasteryUnlockedLevels: number[];
  plantMasteryIntroBarComplete?: boolean;
  goalSlots: ('empty' | 'loading' | 'green' | 'completed')[];
  goalPlantTypes: number[];
  goalLoadingSeconds: number;
  goalCounts: number[];
  goalAmountsRequired: number[];
  goalCompletedValues: number[];
  goalDisplayOrder: number[];
  goalDiscoveryLightGreenActive?: boolean[];
  coinGoalVisible: boolean;
  coinGoalValue: number;
  coinGoalTimeRemaining: number;
  newGoalsSinceDiscovery: number;
  discoveryGoalsRemaining?: number;
  lastMergeDiscoveryLevel: number;
  lastSpawnedGoalLevels: [number, number];
  pendingUnlockUpgradeId: string | null;
  levelUpPopupQueue: number[];
  wildGrowthAccumulatorMs?: number;
  barnShelvesUnlocked: boolean[];
  /** Local day key (`YYYY-MM-DD`) when daily allowance was last claimed in this garden. */
  dailyAllowanceClaimedDayKey?: string;
  /** Per-garden store free-offer ids (slot 0 may show allowance before these apply). */
  storeFreeOfferSlots?: [string, string];
  /** Per-garden store slot cooldown end timestamps (ms). */
  storeSlotCooldownEnds?: [number, number];
  /** Epoch ms when this garden last ran in-session idle sim (while another garden was active). */
  lastInactiveSimAt?: number;
}
