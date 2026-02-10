import { CAMPAIGN_SAVE_KEY } from '../constants/campaign';
import { CampaignSaveV1, CampaignState } from '../types/campaign';

function isValidSave(candidate: unknown): candidate is CampaignSaveV1 {
  if (!candidate || typeof candidate !== 'object') return false;
  const save = candidate as CampaignSaveV1;
  return save.version === 1 && typeof save.updatedAt === 'number' && !!save.state;
}

export function loadCampaignSave(): CampaignSaveV1 | null {
  try {
    const raw = localStorage.getItem(CAMPAIGN_SAVE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSave(parsed)) {
      localStorage.removeItem(CAMPAIGN_SAVE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(CAMPAIGN_SAVE_KEY);
    return null;
  }
}

export function saveCampaignState(state: CampaignState): void {
  const payload: CampaignSaveV1 = {
    version: 1,
    updatedAt: Date.now(),
    state,
  };
  localStorage.setItem(CAMPAIGN_SAVE_KEY, JSON.stringify(payload));
}

export function clearCampaignSave(): void {
  localStorage.removeItem(CAMPAIGN_SAVE_KEY);
}
