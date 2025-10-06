
import React from 'react';

interface DiceProps {
  values: [number, number];
  rolling: boolean;
}

const DieFace: React.FC<{ value: number }> = ({ value }) => {
  const pips = Array(value).fill(0);
  
  const baseClasses = "w-20 h-20 bg-white rounded-lg shadow-lg flex items-center justify-center p-2 transform transition-transform duration-300";
  const gridClasses: { [key: number]: string } = {
    1: 'justify-center',
    2: 'justify-between',
    3: 'justify-between',
    4: 'justify-between',
    5: 'justify-between',
    6: 'justify-between',
  };
  const columnClasses: { [key: number]: string } = {
    4: 'flex-col',
    5: 'flex-col',
    6: 'flex-col',
  };

  const pip = <div className="w-4 h-4 bg-black rounded-full"></div>;

  return (
    <div className={`${baseClasses} ${gridClasses[value] || ''} ${columnClasses[value] || ''}`}>
      {value === 1 && pip}
      {value === 2 && <>{pip}{pip}</>}
      {value === 3 && <>
          <div className="self-start">{pip}</div>
          <div className="self-center">{pip}</div>
          <div className="self-end">{pip}</div>
      </>}
      {value === 4 && <div className="flex flex-col justify-between h-full w-full">{<><div className="flex justify-between">{pip}{pip}</div><div className="flex justify-between">{pip}{pip}</div></>}</div>}
      {value === 5 && <div className="flex flex-col justify-between h-full w-full">{<><div className="flex justify-between">{pip}{pip}</div><div className="flex justify-center">{pip}</div><div className="flex justify-between">{pip}{pip}</div></>}</div>}
      {value === 6 && <div className="flex flex-col justify-between h-full w-full">{<><div className="flex justify-between">{pip}{pip}</div><div className="flex justify-between">{pip}{pip}</div><div className="flex justify-between">{pip}{pip}</div></>}</div>}
    </div>
  );
};

const Dice: React.FC<DiceProps> = ({ values, rolling }) => {
  const rollingClass = rolling ? 'animate-spin' : '';
  return (
    <div className="flex items-center justify-center space-x-4 p-4 min-h-[120px]">
      <div className={rollingClass}><DieFace value={values[0]} /></div>
      <div className={rollingClass}><DieFace value={values[1]} /></div>
    </div>
  );
};

export default Dice;
