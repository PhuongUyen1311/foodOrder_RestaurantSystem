import ProductRecommender from '../Product-Recommender/ProductRecommender';
import Category from '../Category/Category';
import ProductList from '../Product-List/ProductList';
import Contact from '../Contact/Contact';

function MenuContent({ accessToken, categories }) {
    return (
        <>
            {accessToken && (
                <>
                    <h2>Gợi ý cho bạn</h2>
                    <ProductRecommender accessToken={accessToken}/>
                </>
            )}

            <h2>Menu</h2>
            <Category categories={categories}/>
            <ProductList />

            <Contact />
        </>
    );
}

export default MenuContent;