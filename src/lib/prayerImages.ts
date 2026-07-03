import ThickSkin from "../assets/prayers/inactive/ThickSkin.png";
import BurstOfStrength from "../assets/prayers/inactive/BurstOfStrength.png";
import ClarityOfThought from "../assets/prayers/inactive/ClarityOfThought.png";
import SharpEye from "../assets/prayers/inactive/SharpEye.png";
import MysticWill from "../assets/prayers/inactive/MysticWill.png";
import RockSkin from "../assets/prayers/inactive/RockSkin.png";
import SuperhumanStrength from "../assets/prayers/inactive/SuperhumanStrength.png";
import ImprovedReflexes from "../assets/prayers/inactive/ImprovedReflexes.png";
import RapidRestore from "../assets/prayers/inactive/RapidRestore.png";
import RapidHeal from "../assets/prayers/inactive/RapidHeal.png";
import ProtectItem from "../assets/prayers/inactive/ProtectItem.png";
import HawkEye from "../assets/prayers/inactive/HawkEye.png";
import MysticLore from "../assets/prayers/inactive/MysticLore.png";
import SteelSkin from "../assets/prayers/inactive/SteelSkin.png";
import UltimateStrength from "../assets/prayers/inactive/UltimateStrength.png";
import IncredibleReflexes from "../assets/prayers/inactive/IncredibleReflexes.png";
import ProtectFromMagic from "../assets/prayers/inactive/ProtectFromMagic.png";
import ProtectFromMissiles from "../assets/prayers/inactive/ProtectFromMissiles.png";
import ProtectFromMelee from "../assets/prayers/inactive/ProtectFromMelee.png";
import EagleEye from "../assets/prayers/inactive/EagleEye.png";
import MysticMight from "../assets/prayers/inactive/MysticMight.png";
import Retribution from "../assets/prayers/inactive/Retribution.png";
import Redemption from "../assets/prayers/inactive/Redemption.png";
import Smite from "../assets/prayers/inactive/Smite.png";
import Chivalry from "../assets/prayers/inactive/Chivalry.png";
import Piety from "../assets/prayers/inactive/Piety.png";
import Preserve from "../assets/prayers/inactive/Preserve.png";
import Rigour from "../assets/prayers/inactive/Rigour.png";
import Augury from "../assets/prayers/inactive/Augury.png";

export const prayerImages: Record<number, string> = {
  4104: ThickSkin,
  4105: BurstOfStrength,
  4106: ClarityOfThought,
  4122: SharpEye,
  4123: MysticWill,
  4107: RockSkin,
  4108: SuperhumanStrength,
  4109: ImprovedReflexes,
  4110: RapidRestore,
  4111: RapidHeal,
  4112: ProtectItem,
  4124: HawkEye,
  4125: MysticLore,
  4113: SteelSkin,
  4114: UltimateStrength,
  4115: IncredibleReflexes,
  4116: ProtectFromMagic,
  4117: ProtectFromMissiles,
  4118: ProtectFromMelee,
  4126: EagleEye,
  4127: MysticMight,
  4119: Retribution,
  4120: Redemption,
  4121: Smite,
  4128: Chivalry,
  4129: Piety,
  5466: Preserve,
  5464: Rigour,
  5465: Augury,
};

export const getPrayerImageUrl = (prayerId: number): string | undefined => {
  return prayerImages[prayerId];
};
