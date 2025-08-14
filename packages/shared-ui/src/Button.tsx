import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({
  children,
  ...props
}) => {


  return (
    <button {...props} className='p-4 rounded-4xl bg-yellow-500
        '>
      {children} testing
    </button>
  );
};

export { Button };
