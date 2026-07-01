import { Link } from "react-router-dom";
import { AppTopBar } from "../../components/layout/AppTopBar";

const homeCategoryCards = [
  {
    title: "치킨",
    description: "바삭한 치킨 메뉴부터 먼저 살펴보기",
    imageUrl: "/assets/home/cta-chicken.png",
    to: "/category/chicken",
  },
  {
    title: "피자",
    description: "피자 브랜드와 메뉴 확인하기",
    imageUrl: "/assets/home/cta-pizza.png",
    to: "/category/pizza",
  },
];

const homePartyGraphics = [
  "bunsik",
  "pizza",
  "hansik",
  "dessert",
  "salad",
  "japanesse",
  "chicken",
  "pizza",
  "hamburger",
  "hotdog",
  "icecream",
  "tang-guk",
];

export function HomePage() {
  return (
    <section className="page page--home">
      <div className="home-food-party" aria-hidden="true">
        {homePartyGraphics.map((slug, index) => (
          <span
            className={`home-food-party__item home-food-party__item--${index + 1}`}
            key={`${slug}-${index}`}
          >
            <img src={`/assets/categories/${slug}.png`} alt="" />
          </span>
        ))}
      </div>

      <AppTopBar action="settings" showLogo />

      <div className="home-intro">
        <h1>나도 안심하고 주문하고 싶다</h1>
      </div>

      <div className="home-cta-stack" aria-label="카테고리 바로가기">
        {homeCategoryCards.map((card) => (
          <Link className="home-cta-card" key={card.to} to={card.to}>
            <img src={card.imageUrl} alt="" loading="eager" />
          </Link>
        ))}
      </div>
    </section>
  );
}
