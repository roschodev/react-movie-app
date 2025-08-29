import { useState } from "react";
import { FaAnglesLeft } from "react-icons/fa6";
import React from "react";

const SideBar = ({ items, barColor = "bg-gray-900", iconSpacing}) => {
  // Group items by groupIndex
  const groupedItems = items.reduce((acc, item) => {
    const group = item.groupIndex ?? 0;
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

    const sortedGroupKeys = Object.keys(groupedItems).sort((a, b) => Number(a) - Number(b));
    const [visible, setVisible] = useState(true)

   
    return (
    <>
      {/* Sidebar (slide in/out) */}
      <div
        className={`
          fixed top-0 left-0 h-screen w-16 flex flex-col justify-between
          ${barColor} text-white shadow-lg z-50
          transform transition-transform duration-300 ease-in-out
          ${visible ? 'translate-x-0' : '-translate-x-20'}
        `}
      >
        {/* TOP SECTION: Grouped icons */}
        <div className="flex-1 flex flex-col items-center pt-4">
          {sortedGroupKeys.map((groupKey, i) => {
            const group = groupedItems[groupKey].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
            const iconSizeClass = "w-${} h-6"; // Default icon size class
            return (
              <div key={`group-${groupKey}`}>
                {group.map((item, idx) => (
                  <SideBarIcon
                    key={`item-${groupKey}-${idx}`}
                    icon={item.icon}
                    text={item.tooltip}
                    iconColor={item.iconColor}
                    hoverColor={item.hoverColor}
                    iconBgColor={item.iconBgColor}
                    iconSpacing={iconSpacing}
                    iconSize={item.iconSize}
                  />
                ))}
                {i < sortedGroupKeys.length - 1 && <Divider />}
              </div>
            );
          })}
        </div>

        {/* BOTTOM: Collapse button */}
        <div className="mb-4 flex justify-center">
          <button onClick={() => setVisible(false)}>
            <FaAnglesLeft className="text-white w-4 h-4 mx-auto transition-transform duration-300 rotate-0" />
          </button>
        </div>
      </div>

      {/* Re-open Button (appears when sidebar is hidden) */}
      {!visible && (
        <button
          onClick={() => setVisible(true)}
          className="fixed bottom-2 left-2 z-40 bg-transparent text-gray-50 p-2 rounded-md shadow-lg transition-transform"
        >
          <FaAnglesLeft className="w-4 h-4 transform rotate-180" />
        </button>
      )}
    </>
  );
};




const Divider = () => (
  <div className="w-8 h-px bg-gray-600 my-2 mx-auto rounded" />
);


const SideBarIcon = ({
  icon,
  text = 'tooltip',
  iconColor = 'text-gray-700',
  hoverColor = 'hover:bg-gray-700',
  iconBgColor = 'bg-gray-800',
  iconSpacing = 'mt-4',
  iconSize = 'w-12 h-12',
}) => {


  
  return (
    <div
      className={`relative flex items-center justify-center ${iconSpacing} ${iconSize} mb-0 mx-auto shadow-lg ${iconBgColor} ${iconColor} ${hoverColor} transition-all duration-100 ease-in-out rounded-3xl hover:rounded-xl group`}
    > {icon}
      
      <span className="absolute w-auto p-2 m-2 min-w-max left-14 rounded-md shadow-md text-white bg-gray-900 text-xs font-bold transition-all duration-100 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 origin-left">
        {text}
      </span>
    </div>
  );
};


export default SideBar;