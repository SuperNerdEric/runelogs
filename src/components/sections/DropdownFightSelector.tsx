import React, {useState} from 'react';
import {FightMetaData} from "../../models/Fight";

interface FightSelectorProps {
    fights: FightMetaData[];
    onSelectFight: (index: number) => void;
    selectedFightIndex: number | undefined;
}

const DropdownFightSelector: React.FC<FightSelectorProps> = ({fights, onSelectFight, selectedFightIndex}) => {
    const [selectedFight, setSelectedFight] = useState(selectedFightIndex);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = Number(event.target.value);
        setSelectedFight(value);
        onSelectFight(value);
    };

    return (
        <select
            className="dropdown-fight-selector"
            value={selectedFight}
            onChange={handleChange}
        >
            {fights.map((fight, index) => (
                <option key={`${index}`} value={`${index}`}>
                    {fight.name}
                </option>
            ))}
        </select>
    );
};

export default DropdownFightSelector;