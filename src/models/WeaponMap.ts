import equipmentJson from "../lib/equipment.json";
import {StyleToCombatClass, Weapon, WeaponCategory, WeaponCategoryOptions} from "./Weapon";

interface Equipment {
    name: string;
    id: number;
    version: string;
    slot: string;
    speed: number;
    category: string;
    isTwoHanded: boolean;
}

export const weaponMap: Record<number, Weapon> = {};

equipmentJson.forEach((equipmentItem: Equipment) => {
    if (equipmentItem.slot === "weapon") {
        const weaponCategory: WeaponCategory = equipmentItem.category as WeaponCategory;

        if (weaponCategory) {
            const weaponOptions = WeaponCategoryOptions[weaponCategory]!;
            if (weaponOptions === undefined) {
                console.debug("No weapon options " + JSON.stringify(equipmentItem));
            } else {
                const combatClass = StyleToCombatClass[weaponOptions[0].styleType];
                weaponMap[equipmentItem.id] = {...equipmentItem, combatClass, category: weaponCategory,};
            }
        }
    }
});
