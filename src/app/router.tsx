import { createBrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AllergiesPage } from '../features/allergies/AllergiesPage';
import { BrandPage } from '../features/brands/BrandPage';
import { BrandsPage } from '../features/brands/BrandsPage';
import { CategoryPage } from '../features/categories/CategoryPage';
import { CategorySearchPage } from '../features/categories/CategorySearchPage';
import { ExplorePage } from '../features/explore/ExplorePage';
import { HomeExamplePage } from '../features/home/HomeExamplePage';
import { HomePage } from '../features/home/HomePage';
import { MenuPage } from '../features/menus/MenuPage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { SearchPage } from '../features/search/SearchPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'example', element: <HomeExamplePage /> },
      { path: 'brands', element: <BrandsPage /> },
      { path: 'explore', element: <ExplorePage /> },
      { path: 'brand/:brandSlug', element: <BrandPage /> },
      { path: 'category/:categorySlug', element: <CategoryPage /> },
      { path: 'category/:categorySlug/search', element: <CategorySearchPage /> },
      { path: 'menu/:menuSlug', element: <MenuPage /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'settings/allergies', element: <AllergiesPage /> },
    ],
  },
]);
