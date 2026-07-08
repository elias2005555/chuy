export interface MenuItem {
  name: string;
  price: number;
  category: string;
}

export const MENU_ITEMS: MenuItem[] = [
  // Desayunos
  { name: 'Burrita', price: 50, category: 'Desayunos' },
  { name: 'Catrachas', price: 30, category: 'Desayunos' },
  { name: 'Enchiladas', price: 65, category: 'Desayunos' },
  { name: 'Baleada Sencilla', price: 15, category: 'Desayunos' },
  { name: 'Baleada con Huevo', price: 20, category: 'Desayunos' },
  { name: 'Baleada con Todo', price: 45, category: 'Desayunos' },
  { name: 'Tortillas con Quesillo', price: 50, category: 'Desayunos' },
  { name: 'Plátano', price: 40, category: 'Desayunos' },
  { name: 'Panqueques', price: 40, category: 'Desayunos' },

  // Golosinas
  { name: 'Nachos', price: 70, category: 'Golosinas' },
  { name: 'Nachos con Pollo', price: 85, category: 'Golosinas' },
  { name: 'Chilaquiles', price: 70, category: 'Golosinas' },
  { name: 'Chilaquiles con Pollo', price: 85, category: 'Golosinas' },
  { name: 'Gringas', price: 70, category: 'Golosinas' },
  { name: 'Flautas', price: 60, category: 'Golosinas' },
  { name: 'Tacos de Maíz', price: 70, category: 'Golosinas' },
  { name: 'Tacos de Harina', price: 70, category: 'Golosinas' },
  { name: 'Tajadas con Carne Molida', price: 70, category: 'Golosinas' },
  { name: 'Pollo con Tajadas', price: 110, category: 'Golosinas' },
  { name: 'Tajadas (Pequeña)', price: 35, category: 'Golosinas' },
  { name: 'Tajadas (Mediana)', price: 45, category: 'Golosinas' },
  { name: 'Tajadas (Grande)', price: 85, category: 'Golosinas' },
  { name: 'Choripapa', price: 65, category: 'Golosinas' },
  { name: 'Chunguipapa', price: 65, category: 'Golosinas' },
  { name: 'Torta', price: 65, category: 'Golosinas' },

  // Platos Fuertes
  { name: 'Alitas 6 uds', price: 150, category: 'Platos Fuertes' },
  { name: 'Alitas 12 uds', price: 260, category: 'Platos Fuertes' },
  { name: 'Chicken Fingers 6 uds', price: 150, category: 'Platos Fuertes' },
  { name: 'Chicken Fingers 12 uds', price: 260, category: 'Platos Fuertes' },
  { name: 'Hamburguesa con Papas', price: 100, category: 'Platos Fuertes' },
  { name: 'Chuleta', price: 115, category: 'Platos Fuertes' },
  { name: 'Pollo', price: 115, category: 'Platos Fuertes' },
  { name: 'Mozzarella', price: 120, category: 'Platos Fuertes' },

  // Bebidas
  { name: 'Agua', price: 10, category: 'Bebidas' },
  { name: 'Gaseosa Portátil', price: 30, category: 'Bebidas' },
  { name: 'Gaseosa Lata', price: 27, category: 'Bebidas' },
  { name: 'Jugos Naturales 500ml', price: 35, category: 'Bebidas' },
  { name: 'Té Lipton', price: 35, category: 'Bebidas' },
  { name: 'Jugo de Lata', price: 20, category: 'Bebidas' },
  { name: 'California', price: 32, category: 'Bebidas' },
  { name: 'Jugo de Cartón', price: 25, category: 'Bebidas' },
  { name: 'Mountain D Peq.', price: 28, category: 'Bebidas' },
  { name: 'Gatorade', price: 40, category: 'Bebidas' },
  { name: 'Jugo de la Granja', price: 28, category: 'Bebidas' },
  { name: 'Agua Dasani 1 Lt', price: 25, category: 'Bebidas' },
  { name: 'Agua Dasani 1/2 Lt', price: 20, category: 'Bebidas' },
  { name: 'Refresco 3 Litros', price: 85, category: 'Bebidas' },
  { name: 'Refresco 2 Litros', price: 65, category: 'Bebidas' },
  { name: 'Refresco 1.5 Litros', price: 55, category: 'Bebidas' },
  { name: 'Refresco 1.1 Litros', price: 45, category: 'Bebidas' },

  // Chucherías
  { name: 'Zambo Grande', price: 45, category: 'Chucherías' },
  { name: 'Zambo Chico', price: 25, category: 'Chucherías' },
  { name: 'Taqueriто', price: 35, category: 'Chucherías' },
  { name: 'Jugo Lata', price: 20, category: 'Chucherías' },
  { name: 'Submarino', price: 25, category: 'Chucherías' },
  { name: 'Sponch', price: 22, category: 'Chucherías' },
  { name: 'Panguesito', price: 30, category: 'Chucherías' },
  { name: 'Rol de Canela', price: 30, category: 'Chucherías' },
  { name: 'Canelita', price: 20, category: 'Chucherías' },
  { name: 'Barrita', price: 20, category: 'Chucherías' },
  { name: 'Pingüino', price: 30, category: 'Chucherías' },
  { name: 'Nito', price: 20, category: 'Chucherías' },
  { name: 'Dálmata / Gansito', price: 25, category: 'Chucherías' },
  { name: 'Empanada de Piña', price: 30, category: 'Chucherías' },

  // Helados
  { name: 'Paleta Sarita', price: 20, category: 'Helados' },
  { name: 'Paletas Artesanales', price: 25, category: 'Helados' },
  { name: 'UFO', price: 35, category: 'Helados' },
  { name: 'Copa Individual', price: 35, category: 'Helados' },
  { name: 'Sandwich Grande', price: 30, category: 'Helados' },
  { name: 'Oreo Helado', price: 40, category: 'Helados' },
  { name: 'Choco Cono', price: 30, category: 'Helados' },
  { name: 'Sandía', price: 25, category: 'Helados' },
  { name: 'Frutería', price: 25, category: 'Helados' },
  { name: 'Cremoso', price: 25, category: 'Helados' },
  { name: 'Chocobanano', price: 15, category: 'Helados' },
  { name: 'Topolino', price: 10, category: 'Helados' },
  { name: 'Palitos', price: 12, category: 'Helados' },
  { name: 'Vasitos', price: 27, category: 'Helados' },
  { name: 'Copa Familiar', price: 85, category: 'Helados' },
];

export const CATEGORIES = ['Desayunos', 'Golosinas', 'Platos Fuertes', 'Bebidas', 'Chucherías', 'Helados'];

// Quick-add drinks shown in the payment modal
export const QUICK_DRINKS: MenuItem[] = [
  { name: 'Agua', price: 10, category: 'Bebidas' },
  { name: 'Gaseosa Portátil', price: 30, category: 'Bebidas' },
  { name: 'Gaseosa Lata', price: 27, category: 'Bebidas' },
  { name: 'Jugo de Lata', price: 20, category: 'Bebidas' },
  { name: 'Jugo de Cartón', price: 25, category: 'Bebidas' },
  { name: 'Té Lipton', price: 35, category: 'Bebidas' },
];
