import React, { createContext, useContext, useState } from "react";

// Create a UserContext
const UserContext = createContext();

// UserProvider component to wrap the app and provide user details
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    contactNumber: "",
  });

  // Function to update user details after signup
  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use UserContext in any component
export const useUser = () => useContext(UserContext);

export default UserProvider;
