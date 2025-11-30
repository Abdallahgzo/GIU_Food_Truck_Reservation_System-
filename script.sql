-- ====================================
-- GIU Food Truck Management System
-- Database Schema Script
-- ====================================
-- Create new schema FoodTruck inside postgres database
-- Create these tables inside postgres using pgAdmin4
-- ====================================


-- Drop tables if they exist (in reverse order due to foreign key constraints)
drop table if exists "FoodTruck"."Sessions";
drop table if exists "FoodTruck"."Carts";
drop table if exists "FoodTruck"."OrderItems";
drop table if exists "FoodTruck"."Orders";
drop table if exists "FoodTruck"."MenuItems";
drop table if exists "FoodTruck"."Trucks";
drop table if exists "FoodTruck"."Users";

-- FoodTruck schema
create schema if not exists "FoodTruck";

-- Users Table
create table if not exists "FoodTruck"."Users"(
"userId" serial primary key,
"name" text not null,
"email" text not null unique,
"password" text not null,
"role" text default 'customer',
"birthDate" date default current_timestamp,
"createdAt" timestamp default current_timestamp
);


-- Trucks Table
create table if not exists "FoodTruck"."Trucks"(
"truckId" serial primary key,
"truckName" text not null unique,
"truckLogo" text,
"ownerId" integer not null,
"truckStatus" text default 'available',
"orderStatus" text default 'available',
"createdAt" timestamp default current_timestamp,
foreign key ("ownerId") references "FoodTruck"."Users"("userId") on delete cascade
);


-- MenuItems Table
create table if not exists "FoodTruck"."MenuItems"(
"itemId" serial primary key,
"truckId" integer not null,
"name" text not null,
"description" text,
"price" numeric(10,2) not null,
"category" text not null,
"status" text default 'available',
"createdAt" timestamp default current_timestamp,
foreign key ("truckId") references "FoodTruck"."Trucks"("truckId") on delete cascade
);


-- Orders Table
create table if not exists "FoodTruck"."Orders"(
"orderId" serial primary key,
"userId" integer not null,
"truckId" integer not null,
"orderStatus" text not null,
"totalPrice" numeric(10,2) not null,
"scheduledPickupTime" timestamp,
"estimatedEarliestPickup" timestamp,
"createdAt" timestamp default current_timestamp,
foreign key ("userId") references "FoodTruck"."Users"("userId") on delete cascade,
foreign key ("truckId") references "FoodTruck"."Trucks"("truckId") on delete cascade
);


-- OrderItems Table
create table if not exists "FoodTruck"."OrderItems"(
"orderItemId" serial primary key,
"orderId" integer not null,
"itemId" integer not null,
"quantity" integer not null,
"price" numeric(10,2) not null,
foreign key ("orderId") references "FoodTruck"."Orders"("orderId") on delete cascade,
foreign key ("itemId") references "FoodTruck"."MenuItems"("itemId") on delete cascade
);


-- Carts Table
create table if not exists "FoodTruck"."Carts"(
"cartId" serial primary key,
"userId" integer not null,
"itemId" integer not null,
"quantity" integer not null,
"price" numeric(10,2) not null,
foreign key ("userId") references "FoodTruck"."Users"("userId") on delete cascade,
foreign key ("itemId") references "FoodTruck"."MenuItems"("itemId") on delete cascade
);


-- Sessions Table
create table if not exists "FoodTruck"."Sessions"(
"id" serial primary key,
"userId" integer not null,
"token" text not null,
"expiresAt" timestamp default current_timestamp,
foreign key ("userId") references "FoodTruck"."Users"("userId") on delete cascade
);



-- ====================================
-- Sample Data (Optional - for testing)
-- ====================================

-- Sample Users
insert into "FoodTruck"."Users"(name, email, password, role, "birthDate")
values('Ahmed Mohamed', 'ahmed@example.com', '$2b$10$hashedpassword1', 'customer', '1998-05-15');

insert into "FoodTruck"."Users"(name, email, password, role, "birthDate")
values('Sara Ali', 'sara@example.com', '$2b$10$hashedpassword2', 'truckOwner', '2000-08-22');

insert into "FoodTruck"."Users"(name, email, password, role, "birthDate")
values('Khaled Hassan', 'khaled@example.com', '$2b$10$hashedpassword3', 'truckOwner', '1995-03-10');


-- Sample Trucks
insert into "FoodTruck"."Trucks"("truckName", "truckLogo", "ownerId", "truckStatus", "orderStatus")
values('Tasty Tacos Truck', 'https://e...content-available-to-author-only...e.com/taco-logo.png', 2, 'available', 'available');

insert into "FoodTruck"."Trucks"("truckName", "truckLogo", "ownerId", "truckStatus", "orderStatus")
values('Burger Paradise', 'https://e...content-available-to-author-only...e.com/burger-logo.png', 3, 'available', 'available');


-- Sample Menu Items
insert into "FoodTruck"."MenuItems"("truckId", name, description, price, category, status)
values(1, 'Beef Burger', 'Delicious beef burger with cheese', 45.99, 'Main Course', 'available');

insert into "FoodTruck"."MenuItems"("truckId", name, description, price, category, status)
values(1, 'Chicken Wrap', 'Grilled chicken wrap with vegetables', 35.50, 'Main Course', 'available');

insert into "FoodTruck"."MenuItems"("truckId", name, description, price, category, status)
values(1, 'French Fries', 'Crispy golden fries', 15.00, 'Sides', 'available');

insert into "FoodTruck"."MenuItems"("truckId", name, description, price, category, status)
values(1, 'Soft Drink', 'Cold refreshing drink', 10.00, 'Beverages', 'available');

insert into "FoodTruck"."MenuItems"("truckId", name, description, price, category, status)
values(2, 'Classic Burger', 'Juicy beef patty with special sauce', 42.00, 'Main Course', 'available');

insert into "FoodTruck"."MenuItems"("truckId", name, description, price, category, status)
values(2, 'Cheese Fries', 'Fries topped with melted cheddar', 18.00, 'Sides', 'available');
-- your code goes here