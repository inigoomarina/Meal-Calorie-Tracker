import { useNavigate } from 'react-router-dom';

const NavLink = ({ to, className, children, onClick }) => {
  const navigate = useNavigate();
  
  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) onClick();
    navigate(to);
  };
  
  return (
    <a href={to} className={className} onClick={handleClick}>
      {children}
    </a>
  );
};

export default NavLink;
