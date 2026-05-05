-- Seed Categories
INSERT INTO categories (id, name, description, image_url, display_order) VALUES
  (uuid_generate_v4(), 'Rice Dishes', 'Authentic Odia rice-based delicacies', 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400', 1),
  (uuid_generate_v4(), 'Dal & Curries', 'Traditional Odia dals and vegetable curries', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', 2),
  (uuid_generate_v4(), 'Street Food', 'Famous Odia street food and snacks', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', 3),
  (uuid_generate_v4(), 'Sweets & Desserts', 'Traditional Odia mithai and sweets', 'https://images.unsplash.com/photo-1607920592519-bab1d6c52afe?w=400', 4),
  (uuid_generate_v4(), 'Pitha & Snacks', 'Odia traditional pithas and snacks', 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400', 5),
  (uuid_generate_v4(), 'Seafood', 'Fresh Odia coastal seafood preparations', 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400', 6)
ON CONFLICT DO NOTHING;

-- Seed Menu Items (using category names to resolve IDs)
WITH cat AS (SELECT id, name FROM categories)
INSERT INTO menu_items (category_id, name, description, price, image_url, is_vegetarian, display_order)
SELECT
  c.id,
  item.name,
  item.description,
  item.price,
  item.image_url,
  item.is_veg,
  item.display_order
FROM (VALUES
  -- Rice Dishes
  ('Rice Dishes', 'Pakhala Bhata', 'Fermented rice soaked in water, served with badi chura and fried vegetables — the soul of Odisha', 80.00, 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400', true, 1),
  ('Rice Dishes', 'Dalma Rice', 'Mixed lentils and vegetables cooked with panch phoron spices, served with steamed rice', 120.00, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', true, 2),
  ('Rice Dishes', 'Khichdi (Odia Style)', 'Comforting rice and lentil porridge tempered with ghee, cumin and green chillies', 100.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', true, 3),
  ('Rice Dishes', 'Curd Rice (Dahi Pakhala)', 'Chilled rice with fresh curd, curry leaves and mustard tempering', 90.00, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400', true, 4),
  -- Dal & Curries
  ('Dal & Curries', 'Dalma', 'Signature Odia dal with mixed vegetables, coconut and cumin — a Jagannath Temple classic', 110.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', true, 1),
  ('Dal & Curries', 'Aloo Potala Rasa', 'Pointed gourd and potato curry in a light tomato-based gravy', 100.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', true, 2),
  ('Dal & Curries', 'Besara', 'Mixed vegetables in mustard paste curry — sharp and aromatic', 110.00, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400', true, 3),
  ('Dal & Curries', 'Santula', 'Stir-fried seasonal vegetables with minimal spices, healthy and fresh', 95.00, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', true, 4),
  -- Street Food
  ('Street Food', 'Dahibara Aloo Dum', 'Soft urad dal vadas soaked in curd with spicy potato gravy — Cuttack''s pride', 70.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', true, 1),
  ('Street Food', 'Ghuguni', 'Spiced yellow peas curry topped with onion, coriander and tamarind chutney', 60.00, 'https://images.unsplash.com/photo-1606491956391-2d2d7af56543?w=400', true, 2),
  ('Street Food', 'Bara (Urad Dal Vada)', 'Crispy fried urad dal fritters, served hot with coconut chutney', 50.00, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400', true, 3),
  ('Street Food', 'Chhena Poda Tikka', 'Grilled cottage cheese skewers marinated in Odia spices', 130.00, 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400', true, 4),
  -- Sweets & Desserts
  ('Sweets & Desserts', 'Chhena Poda', 'Caramelised cottage cheese dessert — the pride of Odia sweets, baked to perfection', 80.00, 'https://images.unsplash.com/photo-1607920592519-bab1d6c52afe?w=400', true, 1),
  ('Sweets & Desserts', 'Rasagola (Pahala Style)', 'Soft, spongy cottage cheese balls in light sugar syrup — the original from Pahala village', 60.00, 'https://images.unsplash.com/photo-1597897406805-db6dcd1cd87e?w=400', true, 2),
  ('Sweets & Desserts', 'Kheer (Odia Rice Kheer)', 'Slow-cooked rice pudding with cardamom, saffron and dry fruits', 90.00, 'https://images.unsplash.com/photo-1601050690117-a92c8e1c3c5f?w=400', true, 3),
  ('Sweets & Desserts', 'Malpua', 'Deep-fried sweet pancakes dipped in sugar syrup, flavoured with fennel', 70.00, 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400', true, 4),
  -- Pitha & Snacks
  ('Pitha & Snacks', 'Chakuli Pitha', 'Crispy rice flour crepes — popular breakfast item from Odisha', 60.00, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400', true, 1),
  ('Pitha & Snacks', 'Arisa Pitha', 'Deep-fried sweet rice flour cake with jaggery — made during festivals', 50.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', true, 2),
  ('Pitha & Snacks', 'Manda Pitha', 'Steamed rice dumpling stuffed with coconut and jaggery', 65.00, 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400', true, 3),
  ('Pitha & Snacks', 'Enduri Pitha', 'Turmeric leaf-wrapped steamed rice cake with coconut-jaggery filling', 70.00, 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', true, 4),
  -- Seafood
  ('Seafood', 'Chingudi Tarkari', 'Fresh prawns cooked in Odia mustard-coconut gravy with panch phoron', 220.00, 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400', false, 1),
  ('Seafood', 'Macha Besara', 'Fish curry in sharp mustard paste — a coastal Odia staple', 180.00, 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400', false, 2),
  ('Seafood', 'Macha Jhola', 'Light and tangy fish curry with tomatoes, turmeric and mustard oil', 160.00, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400', false, 3),
  ('Seafood', 'Chingudi Malai Curry', 'Prawns in creamy coconut milk curry with subtle spices', 250.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', false, 4)
) AS item(category_name, name, description, price, image_url, is_veg, display_order)
JOIN cat c ON c.name = item.category_name
ON CONFLICT DO NOTHING;
