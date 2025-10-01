import React from 'react';
import { Waves } from 'lucide-react';

const Logo: React.FC = () => {
    return (
        <div className="flex items-center space-x-2">
            <div className="p-2 bg-brand-DEFAULT rounded-lg">
                <Waves className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
                OceanCollect
            </span>
        </div>
    );
};

export default Logo;
