/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Category data with icons and colors
const categoryTemplates = [
  { name: 'Groceries', icon: '🛒', color: '#10b981' },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
  { name: 'Utilities', icon: '💡', color: '#f59e0b' },
  { name: 'Entertainment', icon: '🎬', color: '#ec4899' },
  { name: 'Healthcare', icon: '🏥', color: '#ef4444' },
  { name: 'Dining', icon: '🍽️', color: '#f97316' },
  { name: 'Shopping', icon: '🛍️', color: '#8b5cf6' },
  { name: 'Travel', icon: '✈️', color: '#06b6d4' },
  { name: 'Education', icon: '📚', color: '#6366f1' },
  { name: 'Fitness', icon: '💪', color: '#84cc16' },
  { name: 'Insurance', icon: '🛡️', color: '#14b8a6' },
  { name: 'Rent', icon: '🏠', color: '#0ea5e9' },
  { name: 'Phone', icon: '📱', color: '#a855f7' },
  { name: 'Internet', icon: '🌐', color: '#22d3ee' },
  { name: 'Subscriptions', icon: '📺', color: '#f43f5e' },
  { name: 'Clothing', icon: '👕', color: '#d946ef' },
  { name: 'Beauty', icon: '💄', color: '#fb7185' },
  { name: 'Pets', icon: '🐾', color: '#fbbf24' },
  { name: 'Gifts', icon: '🎁', color: '#c084fc' },
  { name: 'Hobbies', icon: '🎨', color: '#4ade80' },
  { name: 'Books', icon: '📖', color: '#60a5fa' },
  { name: 'Electronics', icon: '💻', color: '#34d399' },
  { name: 'Furniture', icon: '🪑', color: '#fb923c' },
  { name: 'Home Improvement', icon: '🔨', color: '#fdba74' },
  { name: 'Garden', icon: '🌱', color: '#86efac' },
  { name: 'Car Maintenance', icon: '🔧', color: '#94a3b8' },
  { name: 'Fuel', icon: '⛽', color: '#fca5a5' },
  { name: 'Parking', icon: '🅿️', color: '#cbd5e1' },
  { name: 'Public Transport', icon: '🚌', color: '#fde047' },
  { name: 'Taxi', icon: '🚕', color: '#fef08a' },
  { name: 'Coffee', icon: '☕', color: '#78716c' },
  { name: 'Snacks', icon: '🍿', color: '#fdba74' },
  { name: 'Fast Food', icon: '🍔', color: '#fca5a5' },
  { name: 'Restaurants', icon: '🍴', color: '#f87171' },
  { name: 'Movies', icon: '🎥', color: '#a78bfa' },
  { name: 'Concerts', icon: '🎵', color: '#c4b5fd' },
  { name: 'Sports', icon: '⚽', color: '#86efac' },
  { name: 'Gaming', icon: '🎮', color: '#818cf8' },
  { name: 'Streaming', icon: '📹', color: '#fb7185' },
  { name: 'Music', icon: '🎧', color: '#a855f7' },
  { name: 'Software', icon: '💾', color: '#60a5fa' },
  { name: 'Cloud Storage', icon: '☁️', color: '#7dd3fc' },
  { name: 'Office Supplies', icon: '📎', color: '#94a3b8' },
  { name: 'Cleaning', icon: '🧹', color: '#bae6fd' },
  { name: 'Laundry', icon: '🧺', color: '#cbd5e1' },
  { name: 'Toiletries', icon: '🧴', color: '#ddd6fe' },
  { name: 'Pharmacy', icon: '💊', color: '#fecaca' },
  { name: 'Dental', icon: '🦷', color: '#bfdbfe' },
  { name: 'Vision', icon: '👓', color: '#e0e7ff' },
  { name: 'Therapy', icon: '🧘', color: '#ddd6fe' },
  { name: 'Vitamins', icon: '💊', color: '#fed7aa' },
  { name: 'Baby', icon: '👶', color: '#fecdd3' },
  { name: 'Childcare', icon: '🍼', color: '#fbcfe8' },
  { name: 'School Supplies', icon: '✏️', color: '#fde68a' },
  { name: 'Tuition', icon: '🎓', color: '#ddd6fe' },
  { name: 'Online Courses', icon: '💻', color: '#bfdbfe' },
  { name: 'Gym', icon: '🏋️', color: '#bbf7d0' },
  { name: 'Yoga', icon: '🧘‍♀️', color: '#d9f99d' },
  { name: 'Sports Equipment', icon: '🏀', color: '#fed7aa' },
  { name: 'Outdoor', icon: '⛺', color: '#99f6e4' },
  { name: 'Bike', icon: '🚴', color: '#a7f3d0' },
  { name: 'Swimming', icon: '🏊', color: '#a5f3fc' },
  { name: 'Skiing', icon: '⛷️', color: '#bae6fd' },
  { name: 'Camping', icon: '🏕️', color: '#bbf7d0' },
  { name: 'Hiking', icon: '🥾', color: '#d9f99d' },
  { name: 'Fishing', icon: '🎣', color: '#a5f3fc' },
  { name: 'Hotel', icon: '🏨', color: '#fca5a5' },
  { name: 'Airfare', icon: '🛫', color: '#93c5fd' },
  { name: 'Train', icon: '🚆', color: '#c7d2fe' },
  { name: 'Car Rental', icon: '🚙', color: '#fcd34d' },
  { name: 'Vacation', icon: '🏖️', color: '#fde047' },
  { name: 'Souvenirs', icon: '🗿', color: '#fef08a' },
  { name: 'Tours', icon: '🗺️', color: '#fed7aa' },
  { name: 'Food Delivery', icon: '🚚', color: '#fbbf24' },
  { name: 'Alcohol', icon: '🍷', color: '#fca5a5' },
  { name: 'Cigarettes', icon: '🚬', color: '#94a3b8' },
  { name: 'Lottery', icon: '🎰', color: '#fde047' },
  { name: 'Donations', icon: '💝', color: '#fda4af' },
  { name: 'Charity', icon: '❤️', color: '#f87171' },
  { name: 'Taxes', icon: '📊', color: '#cbd5e1' },
  { name: 'Bank Fees', icon: '🏦', color: '#e2e8f0' },
  { name: 'Legal', icon: '⚖️', color: '#94a3b8' },
  { name: 'Accounting', icon: '📈', color: '#cbd5e1' },
  { name: 'Consulting', icon: '👔', color: '#a5b4fc' },
  { name: 'Freelance', icon: '💼', color: '#c4b5fd' },
  { name: 'Investment', icon: '📊', color: '#34d399' },
  { name: 'Savings', icon: '💰', color: '#fbbf24' },
  { name: 'Debt Payment', icon: '💳', color: '#fca5a5' },
  { name: 'Mortgage', icon: '🏡', color: '#3b82f6' },
  { name: 'Student Loan', icon: '🎓', color: '#6366f1' },
  { name: 'Credit Card', icon: '💳', color: '#ef4444' },
  { name: 'Personal Loan', icon: '💵', color: '#f59e0b' },
  { name: 'Home Insurance', icon: '🏠', color: '#14b8a6' },
  { name: 'Car Insurance', icon: '🚗', color: '#06b6d4' },
  { name: 'Health Insurance', icon: '🏥', color: '#10b981' },
  { name: 'Life Insurance', icon: '👨‍👩‍👧‍👦', color: '#8b5cf6' },
  { name: 'Pet Insurance', icon: '🐕', color: '#ec4899' },
  { name: 'Jewelry', icon: '💎', color: '#d946ef' },
  { name: 'Watches', icon: '⌚', color: '#a855f7' },
  { name: 'Bags', icon: '👜', color: '#c084fc' },
  { name: 'Shoes', icon: '👟', color: '#fb7185' },
  { name: 'Accessories', icon: '🕶️', color: '#fda4af' },
  { name: 'Haircut', icon: '💇', color: '#fbcfe8' },
  { name: 'Spa', icon: '💆', color: '#fce7f3' },
  { name: 'Makeup', icon: '💄', color: '#fecdd3' },
  { name: 'Skincare', icon: '🧖', color: '#fed7aa' },
  { name: 'Perfume', icon: '🌸', color: '#fef3c7' },
  { name: 'Dog Food', icon: '🐕', color: '#fed7aa' },
  { name: 'Cat Food', icon: '🐈', color: '#fde68a' },
  { name: 'Veterinary', icon: '🏥', color: '#bbf7d0' },
  { name: 'Pet Grooming', icon: '✂️', color: '#d9f99d' },
  { name: 'Pet Toys', icon: '🎾', color: '#fde047' },
  { name: 'Flowers', icon: '🌹', color: '#fda4af' },
  { name: 'Cards', icon: '💌', color: '#fbcfe8' },
  { name: 'Wrapping', icon: '🎀', color: '#fce7f3' },
  { name: 'Party Supplies', icon: '🎉', color: '#fef3c7' },
  { name: 'Photography', icon: '📷', color: '#c4b5fd' },
  { name: 'Art Supplies', icon: '🖌️', color: '#ddd6fe' },
  { name: 'Crafts', icon: '✂️', color: '#e0e7ff' },
  { name: 'Music Instruments', icon: '🎸', color: '#a5f3fc' },
  { name: 'Plants', icon: '🪴', color: '#bbf7d0' },
  { name: 'Tools', icon: '🔨', color: '#cbd5e1' },
  { name: 'Hardware', icon: '🔩', color: '#e2e8f0' },
  { name: 'Paint', icon: '🎨', color: '#fed7aa' },
  { name: 'Appliances', icon: '🔌', color: '#fde68a' },
  { name: 'Decor', icon: '🖼️', color: '#fef3c7' },
  { name: 'Lighting', icon: '💡', color: '#fef08a' },
  { name: 'Bedding', icon: '🛏️', color: '#e0e7ff' },
  { name: 'Kitchenware', icon: '🍳', color: '#fed7aa' },
  { name: 'Storage', icon: '📦', color: '#e2e8f0' },
  { name: 'Batteries', icon: '🔋', color: '#fde68a' },
  { name: 'Chargers', icon: '🔌', color: '#fef3c7' },
  { name: 'Cables', icon: '🔌', color: '#fef08a' },
  { name: 'Headphones', icon: '🎧', color: '#ddd6fe' },
  { name: 'Speakers', icon: '🔊', color: '#c4b5fd' },
  { name: 'Camera', icon: '📸', color: '#bfdbfe' },
  { name: 'Smartwatch', icon: '⌚', color: '#a5f3fc' },
  { name: 'Tablet', icon: '📱', color: '#99f6e4' },
  { name: 'Laptop', icon: '💻', color: '#a7f3d0' },
  { name: 'Desktop', icon: '🖥️', color: '#bbf7d0' },
  { name: 'Monitor', icon: '🖥️', color: '#d9f99d' },
  { name: 'Keyboard', icon: '⌨️', color: '#fde68a' },
  { name: 'Mouse', icon: '🖱️', color: '#fed7aa' },
  { name: 'Printer', icon: '🖨️', color: '#e2e8f0' },
  { name: 'Scanner', icon: '📄', color: '#cbd5e1' },
  { name: 'Router', icon: '📡', color: '#a5f3fc' },
  { name: 'Miscellaneous', icon: '📌', color: '#94a3b8' }
];

// Expense title templates by category
const expenseTitles = {
  Groceries: ['Weekly groceries', 'Supermarket shopping', 'Fresh produce', 'Organic food', 'Bulk shopping'],
  Transportation: ['Gas station', 'Car wash', 'Metro card', 'Bus ticket', 'Uber ride'],
  Utilities: ['Electric bill', 'Water bill', 'Gas bill', 'Heating', 'AC maintenance'],
  Entertainment: ['Movie tickets', 'Concert tickets', 'Theater show', 'Museum visit', 'Theme park'],
  Healthcare: ['Doctor visit', 'Prescription meds', 'Lab tests', 'Physical therapy', 'Dental checkup'],
  Dining: ['Lunch meeting', 'Dinner date', 'Family brunch', 'Coffee shop', 'Breakfast cafe'],
  Shopping: ['New clothes', 'Shoes purchase', 'Online shopping', 'Mall trip', 'Outlet store'],
  Travel: ['Flight booking', 'Hotel reservation', 'Car rental', 'Travel insurance', 'Airport transfer'],
  Education: ['Online course', 'Textbooks', 'School fees', 'Workshop', 'Certification exam'],
  Fitness: ['Gym membership', 'Personal trainer', 'Workout gear', 'Protein supplements', 'Yoga class'],
  Insurance: ['Monthly premium', 'Policy renewal', 'Coverage payment', 'Annual insurance', 'Insurance deductible'],
  Rent: ['Monthly rent', 'Apartment payment', 'Housing payment', 'Lease payment', 'Rent due'],
  Phone: ['Phone bill', 'Mobile plan', 'Cell service', 'Data plan', 'Phone recharge'],
  Internet: ['Internet bill', 'Broadband payment', 'WiFi service', 'Monthly internet', 'ISP payment'],
  Subscriptions: ['Netflix subscription', 'Spotify premium', 'Monthly membership', 'Service renewal', 'App subscription'],
  Clothing: ['New outfit', 'Wardrobe update', 'Clothing haul', 'Fashion purchase', 'Apparel shopping'],
  Beauty: ['Beauty products', 'Cosmetics purchase', 'Skincare items', 'Makeup haul', 'Beauty essentials'],
  Pets: ['Pet supplies', 'Pet food', 'Animal care', 'Pet treats', 'Pet accessories'],
  Gifts: ['Birthday gift', 'Anniversary present', 'Gift shopping', 'Holiday gift', 'Special occasion'],
  Hobbies: ['Hobby supplies', 'Craft materials', 'Hobby equipment', 'Leisure items', 'Hobby project'],
  Books: ['New book', 'Book purchase', 'Reading material', 'Bookstore visit', 'E-book'],
  Electronics: ['Tech gadget', 'Electronics purchase', 'Device upgrade', 'Tech accessory', 'Electronic item'],
  Furniture: ['Furniture piece', 'Home furniture', 'New furnishing', 'Furniture upgrade', 'Room furniture'],
  'Home Improvement': ['Home repair', 'House maintenance', 'Home upgrade', 'Renovation cost', 'Fix and repair'],
  Garden: ['Garden supplies', 'Plant purchase', 'Gardening tools', 'Outdoor plants', 'Garden care'],
  'Car Maintenance': ['Oil change', 'Car service', 'Vehicle maintenance', 'Auto repair', 'Car checkup'],
  Fuel: ['Gas refill', 'Fuel station', 'Petrol expense', 'Tank refill', 'Gas purchase'],
  Parking: ['Parking fee', 'Parking ticket', 'Garage parking', 'Parking meter', 'Lot parking'],
  'Public Transport': ['Bus fare', 'Metro ticket', 'Public transit', 'Train fare', 'Transit pass'],
  Taxi: ['Taxi ride', 'Cab fare', 'Rideshare', 'Taxi service', 'Car service'],
  Coffee: ['Coffee shop', 'Morning coffee', 'Cafe visit', 'Latte purchase', 'Coffee break'],
  Snacks: ['Snack purchase', 'Quick snack', 'Munchies', 'Snack break', 'Convenience store'],
  'Fast Food': ['Quick meal', 'Drive-through', 'Fast food meal', 'Burger joint', 'Quick bite'],
  Restaurants: ['Restaurant meal', 'Fine dining', 'Eat out', 'Restaurant visit', 'Dinner out'],
  Movies: ['Cinema tickets', 'Movie night', 'Film screening', 'Theater visit', 'Movie date'],
  Concerts: ['Concert tickets', 'Live show', 'Music event', 'Concert night', 'Live performance'],
  Sports: ['Sports event', 'Game tickets', 'Sports gear', 'Athletic event', 'Sports activity'],
  Gaming: ['Video game', 'Gaming purchase', 'Game download', 'Gaming subscription', 'In-game purchase'],
  Streaming: ['Streaming service', 'Video platform', 'Online streaming', 'Digital content', 'Media streaming'],
  Music: ['Music purchase', 'Album download', 'Music streaming', 'Concert tickets', 'Music service'],
  Software: ['Software license', 'App purchase', 'Program subscription', 'Software tool', 'Digital software'],
  'Cloud Storage': ['Cloud backup', 'Storage upgrade', 'Cloud service', 'Online storage', 'Data backup'],
  'Office Supplies': ['Office items', 'Stationery', 'Work supplies', 'Office materials', 'Desk supplies'],
  Cleaning: ['Cleaning supplies', 'Household cleaners', 'Cleaning products', 'Sanitizing items', 'Cleaning tools'],
  Laundry: ['Laundry service', 'Dry cleaning', 'Laundry detergent', 'Wash and fold', 'Cleaning service'],
  Toiletries: ['Personal care', 'Bathroom items', 'Hygiene products', 'Toiletry items', 'Personal hygiene'],
  Pharmacy: ['Pharmacy visit', 'Medicine purchase', 'Medication refill', 'Drugstore', 'Prescription pickup'],
  Dental: ['Dental appointment', 'Dentist visit', 'Teeth cleaning', 'Dental care', 'Orthodontic'],
  Vision: ['Eye exam', 'Glasses purchase', 'Contact lenses', 'Optometrist', 'Vision care'],
  Therapy: ['Therapy session', 'Counseling', 'Mental health', 'Therapist visit', 'Wellness session'],
  Vitamins: ['Supplements', 'Vitamin purchase', 'Health supplements', 'Nutritional aids', 'Wellness vitamins'],
  Baby: ['Baby supplies', 'Infant items', 'Baby care', 'Baby products', 'Newborn essentials'],
  Childcare: ['Daycare payment', 'Babysitter', 'Childcare service', 'Nanny payment', 'Child supervision'],
  'School Supplies': ['School items', 'Student supplies', 'Learning materials', 'Classroom needs', 'School essentials'],
  Tuition: ['Tuition payment', 'School fees', 'Education cost', 'Course tuition', 'Academic fees'],
  'Online Courses': ['E-learning', 'Course enrollment', 'Online class', 'Digital learning', 'Virtual course'],
  Gym: ['Gym membership', 'Fitness center', 'Workout facility', 'Health club', 'Gym fees'],
  Yoga: ['Yoga class', 'Meditation session', 'Yoga studio', 'Wellness class', 'Mindfulness'],
  'Sports Equipment': ['Sports gear', 'Athletic equipment', 'Fitness equipment', 'Sports items', 'Training gear'],
  Outdoor: ['Outdoor gear', 'Adventure equipment', 'Outdoor activities', 'Nature gear', 'Camping supplies'],
  Bike: ['Bicycle maintenance', 'Bike accessories', 'Cycling gear', 'Bike repair', 'Cycling equipment'],
  Swimming: ['Pool membership', 'Swim gear', 'Swimming lessons', 'Pool pass', 'Aquatic center'],
  Skiing: ['Ski pass', 'Ski equipment', 'Mountain resort', 'Ski rental', 'Winter sports'],
  Camping: ['Camping gear', 'Outdoor camping', 'Camping trip', 'Tent supplies', 'Camping equipment'],
  Hiking: ['Hiking gear', 'Trail equipment', 'Hiking boots', 'Outdoor trek', 'Mountain gear'],
  Fishing: ['Fishing gear', 'Fishing license', 'Tackle supplies', 'Fishing trip', 'Angling equipment'],
  Hotel: ['Hotel stay', 'Accommodation', 'Lodging', 'Hotel booking', 'Room reservation'],
  Airfare: ['Flight tickets', 'Airline booking', 'Air travel', 'Plane tickets', 'Aviation'],
  Train: ['Train tickets', 'Rail travel', 'Train journey', 'Railway fare', 'Train booking'],
  'Car Rental': ['Rental car', 'Vehicle rental', 'Car hire', 'Auto rental', 'Temporary vehicle'],
  Vacation: ['Holiday trip', 'Vacation expense', 'Travel package', 'Getaway', 'Holiday cost'],
  Souvenirs: ['Travel souvenirs', 'Memorabilia', 'Gift items', 'Tourist items', 'Keepsakes'],
  Tours: ['Guided tour', 'Sightseeing', 'Tour package', 'Excursion', 'Tourist activity'],
  'Food Delivery': ['Meal delivery', 'Food order', 'Takeout', 'Delivery service', 'Online food'],
  Alcohol: ['Wine purchase', 'Spirits', 'Beer', 'Alcoholic beverages', 'Liquor store'],
  Cigarettes: ['Tobacco products', 'Smoking supplies', 'Cigarette pack', 'Tobacco purchase', 'Smoking items'],
  Lottery: ['Lottery tickets', 'Gaming', 'Lucky draw', 'Raffle tickets', 'Lottery play'],
  Donations: ['Charitable donation', 'Giving', 'Contribution', 'Donation pledge', 'Philanthropic gift'],
  Charity: ['Charity contribution', 'Non-profit donation', 'Charitable cause', 'Giving back', 'Charity support'],
  Taxes: ['Tax payment', 'Tax filing', 'Government tax', 'Tax obligation', 'Tax due'],
  'Bank Fees': ['Banking fee', 'Service charge', 'Account fee', 'Transaction fee', 'Bank charge'],
  Legal: ['Legal fees', 'Attorney cost', 'Legal services', 'Lawyer fees', 'Legal consultation'],
  Accounting: ['Accounting services', 'Tax preparation', 'Bookkeeping', 'Financial services', 'CPA fees'],
  Consulting: ['Consulting fees', 'Professional advice', 'Expert consultation', 'Advisory services', 'Consultant payment'],
  Freelance: ['Freelance payment', 'Contract work', 'Gig payment', 'Freelancer fee', 'Independent work'],
  Investment: ['Investment deposit', 'Stock purchase', 'Portfolio addition', 'Investment fund', 'Asset purchase'],
  Savings: ['Savings deposit', 'Emergency fund', 'Savings account', 'Money saved', 'Rainy day fund'],
  'Debt Payment': ['Debt installment', 'Loan payment', 'Credit payment', 'Debt reduction', 'Payoff'],
  Mortgage: ['Mortgage payment', 'Home loan', 'Housing loan', 'Mortgage installment', 'Property loan'],
  'Student Loan': ['Student debt', 'Education loan', 'Tuition loan', 'Student payment', 'Academic debt'],
  'Credit Card': ['Credit payment', 'Card bill', 'Credit card due', 'Card payment', 'Credit installment'],
  'Personal Loan': ['Personal debt', 'Loan installment', 'Personal payment', 'Loan repayment', 'Debt payment'],
  'Home Insurance': ['Home coverage', 'Property insurance', 'House insurance', 'Homeowner policy', 'Home protection'],
  'Car Insurance': ['Auto insurance', 'Vehicle coverage', 'Car policy', 'Auto protection', 'Vehicle insurance'],
  'Health Insurance': ['Medical insurance', 'Health coverage', 'Medical plan', 'Health policy', 'Medical protection'],
  'Life Insurance': ['Life policy', 'Life coverage', 'Life protection', 'Insurance premium', 'Life plan'],
  'Pet Insurance': ['Pet coverage', 'Animal insurance', 'Pet protection', 'Veterinary insurance', 'Pet policy'],
  Jewelry: ['Jewelry purchase', 'Fine jewelry', 'Accessory', 'Precious items', 'Jewelry piece'],
  Watches: ['Watch purchase', 'Timepiece', 'Wristwatch', 'Watch repair', 'Watch accessory'],
  Bags: ['Bag purchase', 'Handbag', 'Purse', 'Backpack', 'Luggage'],
  Shoes: ['Footwear', 'Shoe purchase', 'Sneakers', 'Boots', 'Shoe shopping'],
  Accessories: ['Fashion accessories', 'Style items', 'Fashion pieces', 'Accessory shopping', 'Style accessories'],
  Haircut: ['Hair salon', 'Haircut service', 'Hair styling', 'Barber visit', 'Hair appointment'],
  Spa: ['Spa treatment', 'Massage', 'Spa day', 'Wellness spa', 'Relaxation'],
  Makeup: ['Makeup products', 'Cosmetics', 'Beauty makeup', 'Makeup purchase', 'Cosmetic items'],
  Skincare: ['Skincare products', 'Facial care', 'Skin treatment', 'Beauty care', 'Skin products'],
  Perfume: ['Fragrance', 'Cologne', 'Perfume bottle', 'Scent purchase', 'Fragrance product'],
  'Dog Food': ['Pet food', 'Dog nutrition', 'Canine food', 'Dog meals', 'Pet supplies'],
  'Cat Food': ['Feline food', 'Cat nutrition', 'Kitty food', 'Cat meals', 'Cat supplies'],
  Veterinary: ['Vet visit', 'Animal doctor', 'Pet checkup', 'Veterinary care', 'Pet health'],
  'Pet Grooming': ['Pet salon', 'Animal grooming', 'Pet cleaning', 'Grooming service', 'Pet care'],
  'Pet Toys': ['Pet play items', 'Animal toys', 'Pet entertainment', 'Play accessories', 'Pet fun'],
  Flowers: ['Flower bouquet', 'Floral arrangement', 'Fresh flowers', 'Flower delivery', 'Florist'],
  Cards: ['Greeting cards', 'Gift cards', 'Occasion cards', 'Card purchase', 'Stationery'],
  Wrapping: ['Gift wrap', 'Wrapping paper', 'Gift packaging', 'Wrapping supplies', 'Gift presentation'],
  'Party Supplies': ['Party items', 'Celebration supplies', 'Event materials', 'Party decorations', 'Festive items'],
  Photography: ['Photo services', 'Photography session', 'Photo shoot', 'Camera services', 'Portrait session'],
  'Art Supplies': ['Art materials', 'Creative supplies', 'Artistic tools', 'Craft materials', 'Art tools'],
  Crafts: ['Craft supplies', 'DIY materials', 'Crafting items', 'Handmade supplies', 'Creative materials'],
  'Music Instruments': ['Instrument purchase', 'Musical equipment', 'Music gear', 'Instrument rental', 'Music tools'],
  Plants: ['Indoor plants', 'Greenery', 'Potted plants', 'Plant care', 'Botanical'],
  Tools: ['Hand tools', 'Power tools', 'Tool purchase', 'Equipment tools', 'Workshop tools'],
  Hardware: ['Hardware items', 'Building supplies', 'Hardware store', 'Construction materials', 'DIY hardware'],
  Paint: ['Paint supplies', 'Wall paint', 'Painting materials', 'Paint purchase', 'Decorator supplies'],
  Appliances: ['Home appliances', 'Kitchen appliances', 'Household devices', 'Appliance purchase', 'Electronic appliances'],
  Decor: ['Home decor', 'Interior decoration', 'Decorative items', 'Home styling', 'Decor pieces'],
  Lighting: ['Light fixtures', 'Lamps', 'Lighting equipment', 'Illumination', 'Light bulbs'],
  Bedding: ['Bed linens', 'Bedding set', 'Sheets and pillows', 'Bedroom textiles', 'Sleep comfort'],
  Kitchenware: ['Kitchen items', 'Cookware', 'Kitchen tools', 'Cooking supplies', 'Kitchen essentials'],
  Storage: ['Storage solutions', 'Organization', 'Storage containers', 'Storage boxes', 'Organization items'],
  Batteries: ['Battery pack', 'Power cells', 'Battery purchase', 'Rechargeable batteries', 'Power supply'],
  Chargers: ['Phone charger', 'Device charger', 'Charging cable', 'Power adapter', 'USB charger'],
  Cables: ['Connection cables', 'Wire purchase', 'Charging cables', 'Data cables', 'Cable accessories'],
  Headphones: ['Audio headphones', 'Earphones', 'Wireless buds', 'Headset', 'Audio gear'],
  Speakers: ['Audio speakers', 'Sound system', 'Bluetooth speaker', 'Speaker set', 'Audio equipment'],
  Camera: ['Camera purchase', 'Photography gear', 'Digital camera', 'Camera equipment', 'Imaging device'],
  Smartwatch: ['Wearable tech', 'Smart device', 'Fitness tracker', 'Digital watch', 'Wearable watch'],
  Tablet: ['Tablet device', 'iPad purchase', 'Tablet computer', 'Mobile tablet', 'Digital tablet'],
  Laptop: ['Laptop computer', 'Notebook purchase', 'Portable computer', 'Laptop upgrade', 'Computer laptop'],
  Desktop: ['Desktop computer', 'PC purchase', 'Computer system', 'Desktop setup', 'Workstation'],
  Monitor: ['Display screen', 'Computer monitor', 'Screen purchase', 'Display monitor', 'Monitor upgrade'],
  Keyboard: ['Computer keyboard', 'Typing keyboard', 'Mechanical keyboard', 'Wireless keyboard', 'Keyboard upgrade'],
  Mouse: ['Computer mouse', 'Wireless mouse', 'Gaming mouse', 'Mouse upgrade', 'Pointing device'],
  Printer: ['Printer purchase', 'Printing device', 'Printer upgrade', 'Home printer', 'Office printer'],
  Scanner: ['Document scanner', 'Scanning device', 'Scanner purchase', 'Digital scanner', 'Document imaging'],
  Router: ['WiFi router', 'Network router', 'Internet router', 'Wireless router', 'Networking device'],
  Miscellaneous: ['Random purchase', 'Misc expense', 'Other items', 'Various items', 'General expense']
};

// Random description generator
const descriptions = [
  'Monthly recurring expense',
  'One-time purchase',
  'Urgent need',
  'Planned expense',
  'Emergency purchase',
  'Discounted price',
  'Sale item',
  'Gift purchase',
  'Household necessity',
  'Personal treat',
  'Work-related expense',
  'Family expense',
  'Special occasion',
  'Regular maintenance',
  'Unexpected cost'
];

// Utility functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// eslint-disable-next-line no-unused-vars
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

function getRandomDate(startDate, endDate) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

// Generate expense title based on category
function generateExpenseTitle(categoryName) {
  const titles = expenseTitles[categoryName];
  if (titles) {
    return getRandomElement(titles);
  }
  return `${categoryName} expense`;
}

// User profiles for load testing
const userProfiles = [
  {
    email: 'load-test-1month@example.com',
    name: 'Load Test - 1 Month',
    categories: 100,
    expenses: 10000,
    months: 1
  },
  {
    email: 'load-test-3months@example.com',
    name: 'Load Test - 3 Months',
    categories: 200,
    expenses: 50000,
    months: 3
  },
  {
    email: 'load-test-6months@example.com',
    name: 'Load Test - 6 Months',
    categories: 250,
    expenses: 100000,
    months: 6
  },
  {
    email: 'load-test-12months@example.com',
    name: 'Load Test - 12 Months',
    categories: 500,
    expenses: 1000000,
    months: 12
  },
  {
    email: 'load-test-24months@example.com',
    name: 'Load Test - 24 Months',
    categories: 500,
    expenses: 10000000,
    months: 24
  }
];

async function main() {
  console.log('🌱 Starting database seeding for load testing...\n');
  console.log('⚠️  WARNING: This will create 11+ million records and may take 30-60 minutes!\n');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.expense.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleared\n');

  // Hash password for test accounts
  const hashedPassword = await bcrypt.hash('Test@123', 10);

  let totalCategories = 0;
  let totalExpenses = 0;
  const startTime = Date.now();

  // Create users and their data
  for (let i = 0; i < userProfiles.length; i++) {
    const profile = userProfiles[i];
    console.log(`\n${'='.repeat(70)}`);
    console.log(`👤 Creating user ${i + 1}/${userProfiles.length}: ${profile.name}`);
    console.log(`   📊 Profile: ${profile.categories} categories, ${profile.expenses.toLocaleString()} expenses, ${profile.months} month(s)`);
    console.log(`${'='.repeat(70)}\n`);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: profile.email,
        password: hashedPassword,
        name: profile.name,
        authProvider: 'local'
      }
    });
    console.log(`✅ Created user: ${profile.email}`);

    // Create categories
    console.log(`📁 Creating ${profile.categories} categories...`);
    const userCategories = [];

    for (let j = 0; j < profile.categories; j++) {
      const template = categoryTemplates[j % categoryTemplates.length];
      const suffix = j >= categoryTemplates.length ? ` ${Math.floor(j / categoryTemplates.length) + 1}` : '';

      userCategories.push({
        name: `${template.name}${suffix}`,
        icon: template.icon,
        color: template.color,
        userId: user.id
      });
    }

    await prisma.category.createMany({
      data: userCategories
    });
    totalCategories += profile.categories;
    console.log(`✅ Created ${profile.categories} categories`);

    // Get all categories for this user
    const categories = await prisma.category.findMany({
      where: { userId: user.id }
    });

    // Create expenses
    console.log(`💰 Creating ${profile.expenses.toLocaleString()} expenses...`);
    const numExpenses = profile.expenses;
    const batchSize = 1000; // Larger batch size for better performance
    const batches = Math.ceil(numExpenses / batchSize);

    // Date range based on months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - profile.months);

    const userStartTime = Date.now();

    for (let batch = 0; batch < batches; batch++) {
      const expenses = [];
      const currentBatchSize = Math.min(batchSize, numExpenses - batch * batchSize);

      for (let k = 0; k < currentBatchSize; k++) {
        const category = getRandomElement(categories);
        const amount = getRandomFloat(5, 500);
        const date = getRandomDate(startDate, endDate);
        const title = generateExpenseTitle(category.name.replace(/\s\d+$/, ''));
        const description = Math.random() > 0.3 ? getRandomElement(descriptions) : null;

        expenses.push({
          title,
          amount,
          currency: 'USD',
          categoryId: category.id,
          description,
          date,
          userId: user.id
        });
      }

      await prisma.expense.createMany({
        data: expenses
      });

      const currentExpenses = (batch + 1) * batchSize > numExpenses ? numExpenses : (batch + 1) * batchSize;
      const progress = ((batch + 1) / batches * 100).toFixed(1);
      const elapsed = ((Date.now() - userStartTime) / 1000).toFixed(1);
      const rate = (currentExpenses / (Date.now() - userStartTime) * 1000).toFixed(0);

      process.stdout.write(`   📊 Progress: ${progress}% | ${currentExpenses.toLocaleString()}/${numExpenses.toLocaleString()} | ${elapsed}s | ${rate} rec/s\r`);
    }

    totalExpenses += numExpenses;
    const userElapsed = ((Date.now() - userStartTime) / 1000).toFixed(1);
    console.log(`\n✅ Created ${numExpenses.toLocaleString()} expenses in ${userElapsed}s`);
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Summary statistics
  console.log(`\n${'='.repeat(70)}`);
  console.log('📈 DATABASE SUMMARY');
  console.log(`${'='.repeat(70)}`);
  console.log(`   👥 Users: ${userProfiles.length}`);
  console.log(`   📁 Categories: ${totalCategories.toLocaleString()}`);
  console.log(`   💰 Expenses: ${totalExpenses.toLocaleString()}`);
  console.log(`   ⏱️  Total time: ${totalTime} minutes`);
  console.log(`   💾 Estimated data size: ~${(totalExpenses * 0.5 / 1024).toFixed(2)} MB\n`);

  console.log('✨ Seeding completed successfully!\n');
  console.log('🔐 LOGIN CREDENTIALS (Password: Test@123):');
  console.log(`${'─'.repeat(70)}`);
  userProfiles.forEach((profile, index) => {
    console.log(`   ${index + 1}. ${profile.email}`);
    console.log(`      ${profile.categories} categories | ${profile.expenses.toLocaleString()} expenses | ${profile.months} month(s)`);
  });
  console.log(`${'─'.repeat(70)}\n`);
}

main()
  .catch((e) => {
    console.error('\n❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
