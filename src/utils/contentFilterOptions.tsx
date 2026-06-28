import {FilterSelectOption} from '../components/filters/FilterSelect';
import {resolveContentSpriteKey} from '../lib/hiscoreSprites';

export function mapContentFilterOptions<T extends { value: string; label: string }>(
    options: readonly T[],
): FilterSelectOption<T['value']>[] {
    return options.map((option) => ({
        value: option.value,
        label: option.label,
        spriteKey: resolveContentSpriteKey(option.value),
    }));
}

export function mapFightFilterOptions(fights: string[]): FilterSelectOption<string>[] {
    return fights.map((fight) => ({
        value: fight,
        label: fight,
    }));
}
