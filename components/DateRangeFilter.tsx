
import React, { useState } from 'react';

type DateRange = {
    start: Date | null;
    end: Date | null;
};

interface DateRangeFilterProps {
    onDateChange: (range: DateRange) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onDateChange }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activePreset, setActivePreset] = useState<string | null>(null);

    const handlePresetClick = (preset: 'today' | 'yesterday' | 'lastWeek') => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let start: Date | null = new Date(today);
        let end: Date | null = new Date(today);
        end.setHours(23, 59, 59, 999);

        if (preset === 'yesterday') {
            start.setDate(today.getDate() - 1);
            end.setDate(today.getDate() - 1);
        } else if (preset === 'lastWeek') {
            const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon,...
            const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) - 7; // go to last monday
            start = new Date(new Date().setDate(diff));
            start.setHours(0,0,0,0);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
        }
        
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
        setActivePreset(preset);
        onDateChange({ start, end });
    };

    const handleDateChange = (type: 'start' | 'end', value: string) => {
        let newStart = startDate;
        let newEnd = endDate;

        if (type === 'start') {
            setStartDate(value);
            newStart = value;
        } else {
            setEndDate(value);
            newEnd = value;
        }

        setActivePreset(null);
        const startObj = newStart ? new Date(`${newStart}T00:00:00`) : null;
        const endObj = newEnd ? new Date(`${newEnd}T23:59:59`) : null;
        
        onDateChange({ start: startObj, end: endObj });
    };
    
    const presetButtonClasses = (preset: string) => 
        `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        activePreset === preset 
        ? 'bg-primary-600 text-white' 
        : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-300'
        }`;

    return (
        <div className="flex items-center space-x-2 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
                <button onClick={() => handlePresetClick('today')} className={presetButtonClasses('today')}>Oggi</button>
                <button onClick={() => handlePresetClick('yesterday')} className={presetButtonClasses('yesterday')}>Ieri</button>
                <button onClick={() => handlePresetClick('lastWeek')} className={presetButtonClasses('lastWeek')}>Settimana Scorsa</button>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="relative">
                    <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => handleDateChange('start', e.target.value)}
                        className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-1.5 px-3 text-sm text-slate-800 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500 w-36"
                    />
                </div>
                <span>al</span>
                 <div className="relative">
                    <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => handleDateChange('end', e.target.value)}
                        className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-1.5 px-3 text-sm text-slate-800 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500 w-36"
                    />
                </div>
            </div>
        </div>
    );
};

export default DateRangeFilter;