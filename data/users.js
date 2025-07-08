import bcrypt from "bcryptjs";

const Users = [
  {
    name: "admin",
    email: "admin@gmail.com",
    password: "$2a$10$MmapIGAhKsm/SnNUNpfC.uKcAiXdUlC3/lBOBvbMui/SeQld.0Z8i",
    isAdmin: true,
    isDelivery: false,
    profilePicture: "/uploads/default.png",
    lastName: "",
    dateOfBirth: null,
    gender: "Male",
    address: {
      doorNo: null,
      street: "",
      nearestLandmark: "",
      city: "",
      state: "",
      pin: null,
      phoneNumber: null,
    },
    orderHistory: [],
    favorites: [],
    cartItems: [],
  },
  {

    name: "dush",
    email: "user@gmail.com",
    password: "$2a$10$1tiRqzeyG1B9AoLCg3sn1OW3XurxdbBkklVZnwScUzas3WhidpfTm",
    isAdmin: false,
    isDelivery: false,
    profilePicture: "/uploads/1742802039244-image.jpg",
    lastName: "Kumar",
    
    gender: "Male",
    address: {
      doorNo: 55,
      street: "Kumaranathapuram",
      nearestLandmark: "Pushpa theatre bustop",
      city: "Tiruppur",
      state: "TN",
      pin: 641602,
      phoneNumber: 7986541230,
    },
    orderHistory: [],

    cartItems: [],
  },
];
export default Users;
