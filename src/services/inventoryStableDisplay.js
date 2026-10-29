import { clubDateTime } from './displayDate.js';
import { MSG, msg, UI_LOCALE } from '../messages/index.js';

// Categories and units are free text in the contract. Preserve server values.
export const displayText = (value, fallback = MSG.CHUA_XAC_DINH) => typeof value === 'string' && value.trim() ? value : msg(fallback);
export const isQuantity = value => typeof value === 'number' && Number.isFinite(value);
export const quantityText = value => isQuantity(value) ? value.toLocaleString(UI_LOCALE, { maximumFractionDigits: 20 }) : msg(MSG.CHUA_XAC_DINH);
export function stockState({ stock, minimumStock }) {
    if (!isQuantity(stock) || !isQuantity(minimumStock) || stock < 0 || minimumStock < 0) return { label: msg(MSG.CHUA_XAC_DINH), tone: 'neutral' };
    // InventoryRepository.ListItemsAsync uses <=, including equality.
    return stock <= minimumStock ? { label: msg(MSG.OPS_LOW_STOCK), tone: 'warning' } : { label: msg(MSG.OPS_STOCK_ABOVE), tone: 'success' };
}
export function movementState(row) {
    if (!isQuantity(row.quantity) || row.quantity === 0) return { label: msg(MSG.CHUA_XAC_DINH), tone: 'neutral' };
    return row.quantity > 0 ? { label: msg(row.replenishmentRequestId ? MSG.INV_IN_REPLENISH : MSG.INV_IN), tone: 'success' } : { label: msg(MSG.INV_OUT), tone: 'warning' };
}
export const signedQuantity = value => isQuantity(value) ? `${value > 0 ? '+' : ''}${quantityText(value)}` : msg(MSG.CHUA_XAC_DINH);
export function operationTime(value) {
    if (typeof value !== 'string' || !value.trim() || !Number.isFinite(Date.parse(value))) return msg(MSG.OPS_TIME_UNKNOWN);
    return clubDateTime(value);
}
export function occupancyState(value) {
    if (value === true) return { label: msg(MSG.SUPPORT_OCCUPIED), tone: 'occupied' };
    if (value === false) return { label: msg(MSG.SUPPORT_VACANT), tone: 'neutral' };
    return { label: msg(MSG.CHUA_XAC_DINH), tone: 'neutral' };
}
export function stallHorse(row, horses) {
    if (row.occupied !== true) return row.occupied === false ? '—' : msg(MSG.OPS_HORSE_UNKNOWN);
    const horse = row.horseId && horses?.find(h => h.id === row.horseId);
    return displayText(horse?.name, MSG.OPS_HORSE_UNKNOWN);
}
export function stayState(endedAt) {
    if (endedAt === null) return { label: msg(MSG.STALL_IN), tone: 'success' };
    if (typeof endedAt === 'string' && endedAt.trim() && Number.isFinite(Date.parse(endedAt))) return { label: msg(MSG.STALL_LEFT), tone: 'neutral' };
    return { label: msg(MSG.CHUA_XAC_DINH), tone: 'neutral' };
}
