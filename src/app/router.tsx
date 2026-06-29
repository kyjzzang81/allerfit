import { createBrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AllergiesPage } from '../features/allergies/AllergiesPage';
import { BrandPage } from '../features/brands/BrandPage';
import { CategoryPage } from '../features/categories/CategoryPage';
import { HomePage } from '../features/home/HomePage';
import { SearchPage } from '../features/search/SearchPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'brand/:brandSlug', element: <BrandPage /> },
      { path: 'category/:categorySlug', element: <CategoryPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'settings/allergies', element: <AllergiesPage /> },
    ],
  },
]);
