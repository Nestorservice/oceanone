import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, id, ...props }) => {
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 text-brand-DEFAULT border-gray-300 rounded focus:ring-brand-light dark:bg-gray-700 dark:border-gray-600"
        {...props}
      />
      <label htmlFor={id} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
        {label}
      </label>
    </div>
  );
};

export default Checkbox;
