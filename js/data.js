/**
 * Sample restaurant data for Farmingdale Lunch Guide
 * In a production app, this would come from an API
 */
const RESTAURANT_DATA = [
    {
        id: 1,
        name: "Campus Pizza",
        category: "pizza",
        price: "$",
        rating: 4.5,
        distance: "0.2 miles",
        description: "Classic NY-style pizza right on campus. Great for a quick slice between classes.",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
        address: "123 Broadhollow Rd, Farmingdale, NY"
    },
    {
        id: 2,
        name: "Green Dragon Chinese",
        category: "asian",
        price: "$$",
        rating: 4.2,
        distance: "0.5 miles",
        description: "Authentic Chinese cuisine with generous portions. Lunch specials available daily.",
        image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400",
        address: "456 Route 110, Farmingdale, NY"
    },
    {
        id: 3,
        name: "Main Street Deli",
        category: "deli",
        price: "$",
        rating: 4.7,
        distance: "0.3 miles",
        description: "Best sandwiches in town! Fresh ingredients and huge portions.",
        image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400",
        address: "789 Main St, Farmingdale, NY"
    },
    {
        id: 4,
        name: "Sushi Express",
        category: "asian",
        price: "$$",
        rating: 4.0,
        distance: "0.8 miles",
        description: "Fresh sushi rolls and bento boxes. Perfect for a healthier lunch option.",
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400",
        address: "321 Conklin St, Farmingdale, NY"
    },
    {
        id: 5,
        name: "Burger Barn",
        category: "fast-food",
        price: "$",
        rating: 4.3,
        distance: "0.4 miles",
        description: "Juicy burgers and crispy fries. A student favorite for years.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
        address: "555 Melville Rd, Farmingdale, NY"
    },
    {
        id: 6,
        name: "The Study Cafe",
        category: "cafe",
        price: "$$",
        rating: 4.6,
        distance: "0.1 miles",
        description: "Coffee, pastries, and light lunches. Great WiFi and study atmosphere.",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
        address: "100 Campus Dr, Farmingdale, NY"
    },
    {
        id: 7,
        name: "Napoli's Pizzeria",
        category: "pizza",
        price: "$$",
        rating: 4.8,
        distance: "0.6 miles",
        description: "Authentic Italian pizza baked in a wood-fired oven. Worth the walk!",
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
        address: "200 Fulton St, Farmingdale, NY"
    },
    {
        id: 8,
        name: "Taco Town",
        category: "fast-food",
        price: "$",
        rating: 4.1,
        distance: "0.5 miles",
        description: "Authentic Mexican tacos and burritos. Taco Tuesday specials!",
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400",
        address: "888 Route 109, Farmingdale, NY"
    },
    {
        id: 9,
        name: "Greenleaf Salads",
        category: "cafe",
        price: "$$",
        rating: 4.4,
        distance: "0.3 miles",
        description: "Fresh, customizable salads and wraps. Healthy eating made easy.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
        address: "150 College Dr, Farmingdale, NY"
    },
    {
        id: 10,
        name: "Tony's Italian Deli",
        category: "deli",
        price: "$$",
        rating: 4.9,
        distance: "0.7 miles",
        description: "Imported Italian meats and cheeses. The hero sandwiches are legendary.",
        image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400",
        address: "300 Main St, Farmingdale, NY"
    }
];

// Freeze the data to prevent accidental modifications
Object.freeze(RESTAURANT_DATA);
RESTAURANT_DATA.forEach(restaurant => Object.freeze(restaurant));
