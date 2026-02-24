import { useCartStore } from '../cart-store';

describe('Cart Store Logic', () => {
    beforeEach(() => {
        // Reset the store before each test
        const { clearCart } = useCartStore.getState();
        clearCart();
    });

    it('adds an item to the cart', () => {
        const { addToCart } = useCartStore.getState();

        addToCart({
            id: 'prod-1',
            name: 'Test Product',
            price: 50,
            stock: 10,
            sku: 'TST-001',
            category: 'Testing'
        } as any);

        const items = useCartStore.getState().items;
        expect(items).toHaveLength(1);
        expect(items[0].quantity).toBe(1);
        expect(items[0].name).toBe('Test Product');
    });

    it('calculates total correctly', () => {
        const { addToCart, updateQuantity, getTotal } = useCartStore.getState();

        addToCart({
            id: 'prod-1',
            name: 'Test Product 1',
            price: 50,
            stock: 10,
            sku: 'TST-001',
            category: 'Testing'
        } as any);

        addToCart({
            id: 'prod-2',
            name: 'Test Product 2',
            price: 25,
            stock: 10,
            sku: 'TST-002',
            category: 'Testing'
        } as any);

        // 50 (qty: 1) + 25 (qty: 1)
        expect(getTotal()).toBe(75);

        // Update quantity of first item
        updateQuantity('prod-1', 2);

        // 50*2 + 25*1
        expect(getTotal()).toBe(125);
    });

    it('removes item from cart', () => {
        const { addToCart, removeFromCart } = useCartStore.getState();

        addToCart({
            id: 'prod-1',
            name: 'Test Product',
            price: 50,
            stock: 10,
            sku: 'TST-001',
            category: 'Testing'
        } as any);

        expect(useCartStore.getState().items).toHaveLength(1);

        removeFromCart('prod-1');

        expect(useCartStore.getState().items).toHaveLength(0);
    });
});
