import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, X } from 'lucide-react';
import { getVariants, getCategories, createSale } from '@/services/api';
import type { PerfumeVariant, Category, CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Cart {
  id: string;
  name: string;
  items: CartItem[];
}

const CartItemComponent = React.memo<{
  item: CartItem;
  onUpdateQuantity: (variantId: number, quantity: number) => void;
  onRemove: (variantId: number) => void;
}>(({ item, onUpdateQuantity, onRemove }) => (
  <div className="flex justify-between items-center p-3 mb-2 bg-muted/50 rounded transition-all duration-150 hover:bg-muted/70">
    <div className="flex-1">
      <div className="font-medium text-sm">{item.variant.perfume_detail?.name}</div>
      <div className="text-xs text-muted-foreground">{item.variant.size_ml}ml</div>
      <div className="text-sm font-medium text-primary">{parseFloat(item.variant.price_mad).toFixed(2)} MAD</div>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-card border rounded">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 transition-all duration-150 active:scale-90"
          onClick={() => onUpdateQuantity(item.variant.id, item.quantity - 1)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdateQuantity(item.variant.id, parseInt(e.target.value) || 1)}
          min={1}
          max={item.variant.stock_qty}
          className="w-16 h-8 text-center border-0"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 transition-all duration-150 active:scale-90"
          onClick={() => onUpdateQuantity(item.variant.id, item.quantity + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive transition-all duration-150 active:scale-90"
        onClick={() => onRemove(item.variant.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </div>
));

CartItemComponent.displayName = 'CartItemComponent';

const POS: React.FC = () => {
  const [variants, setVariants] = useState<PerfumeVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [carts, setCarts] = useState<Cart[]>([{ id: '1', name: 'A', items: [] }]);
  const [activeCartId, setActiveCartId] = useState('1');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'warning'} | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
    fetchVariants();
    // Autofocus sur le champ de recherche
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchText]);

  useEffect(() => {
    fetchVariants();
  }, [debouncedSearchText, selectedCategory]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      // Handle both direct array and paginated response
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.results || [];
      setCategories(data);
    } catch (error) {
      showToast('Erreur lors du chargement des catégories', 'error');
      setCategories([]); // Ensure categories is always an array
    }
  };

  const fetchVariants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getVariants({
        search: debouncedSearchText || undefined,
        perfume: selectedCategory ? parseInt(selectedCategory) : undefined,
      });
      // Handle both direct array and paginated response
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.results || [];
      setVariants(data.filter(v => v.is_active && v.is_in_stock));
    } catch (error) {
      showToast('Erreur lors du chargement des produits', 'error');
      setVariants([]); // Ensure variants is always an array
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchText, selectedCategory]);

  const getActiveCart = useCallback(() => {
    return carts.find(c => c.id === activeCartId) || carts[0];
  }, [carts, activeCartId]);

  const addNewCart = useCallback(() => {
    // Limiter à 3 paniers maximum
    if (carts.length >= 3) {
      showToast('Maximum 3 clients à la fois', 'warning');
      return;
    }

    // Trouver la prochaine lettre disponible (A, B, C)
    const availableNames = ['A', 'B', 'C'];
    const usedNames = carts.map(c => c.name);
    const nextName = availableNames.find(name => !usedNames.includes(name)) || 'A';

    const newCart: Cart = {
      id: Date.now().toString(),
      name: nextName,
      items: [],
    };
    setCarts([...carts, newCart]);
    setActiveCartId(newCart.id);
  }, [carts]);

  const removeCart = useCallback((cartId: string) => {
    if (carts.length === 1) {
      showToast('Vous devez avoir au moins un panier', 'warning');
      return;
    }
    const newCarts = carts.filter(c => c.id !== cartId);
    setCarts(newCarts);
    if (activeCartId === cartId) {
      setActiveCartId(newCarts[0].id);
    }
  }, [carts, activeCartId]);

  const addToCart = useCallback((variant: PerfumeVariant) => {
    setCarts(prevCarts => {
      const activeCart = prevCarts.find(c => c.id === activeCartId);
      if (!activeCart) return prevCarts;

      const existingItem = activeCart.items.find(item => item.variant.id === variant.id);

      if (existingItem) {
        if (existingItem.quantity >= variant.stock_qty) {
          showToast('Stock insuffisant', 'warning');
          return prevCarts;
        }
        return prevCarts.map(c =>
          c.id === activeCartId
            ? {
                ...c,
                items: c.items.map(item =>
                  item.variant.id === variant.id
                    ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * parseFloat(item.variant.price_mad) }
                    : item
                )
              }
            : c
        );
      } else {
        const newItem: CartItem = {
          variant,
          quantity: 1,
          subtotal: parseFloat(variant.price_mad),
        };
        showToast('Produit ajouté au panier', 'success');
        return prevCarts.map(c =>
          c.id === activeCartId
            ? { ...c, items: [...c.items, newItem] }
            : c
        );
      }
    });
  }, [activeCartId]);

  const updateQuantity = useCallback((variantId: number, newQuantity: number) => {
    setCarts(prevCarts => prevCarts.map(c =>
      c.id === activeCartId
        ? {
            ...c,
            items: c.items.map(item => {
              if (item.variant.id === variantId) {
                const maxQty = item.variant.stock_qty;
                const quantity = Math.min(Math.max(1, newQuantity), maxQty);
                return {
                  ...item,
                  quantity,
                  subtotal: quantity * parseFloat(item.variant.price_mad),
                };
              }
              return item;
            })
          }
        : c
    ));
  }, [activeCartId]);

  const removeFromCart = useCallback((variantId: number) => {
    setCarts(prevCarts => prevCarts.map(c =>
      c.id === activeCartId
        ? { ...c, items: c.items.filter(item => item.variant.id !== variantId) }
        : c
    ));
  }, [activeCartId]);

  const calculateTotal = useCallback(() => {
    const activeCart = getActiveCart();
    return activeCart.items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [getActiveCart]);

  const handleCheckout = () => {
    const activeCart = getActiveCart();
    if (activeCart.items.length === 0) {
      showToast('Le panier est vide', 'warning');
      return;
    }
    setPaymentModalVisible(true);
  };

  const processSale = async () => {
    try {
      const activeCart = getActiveCart();
      setLoading(true);
      await createSale({
        items: activeCart.items.map(item => ({
          variant: item.variant.id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
      });
      showToast('Vente enregistrée avec succès', 'success');

      // Fermer le panier du client après la vente
      const remainingCarts = carts.filter(c => c.id !== activeCartId);
      if (remainingCarts.length === 0) {
        // Si c'était le dernier panier, créer un nouveau panier vide
        const newCartId = Date.now().toString();
        setCarts([{ id: newCartId, name: 'A', items: [] }]);
        setActiveCartId(newCartId);
      } else {
        // Sinon, supprimer le panier actuel et basculer sur le premier panier restant
        setCarts(remainingCarts);
        setActiveCartId(remainingCarts[0].id);
      }

      setPaymentModalVisible(false);
      setPaymentMethod('cash'); // Réinitialiser la méthode de paiement
      fetchVariants();
    } catch (error) {
      showToast('Erreur lors de l\'enregistrement de la vente', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg",
          toast.type === 'success' && "bg-green-600 text-white",
          toast.type === 'error' && "bg-destructive text-destructive-foreground",
          toast.type === 'warning' && "bg-yellow-500 text-white"
        )}>
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-[1fr_450px] gap-6 h-[calc(100vh-160px)]">
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher un produit ou scanner un code-barres"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="pl-10 focus-visible:ring-0 focus-visible:border-input"
              />
            </div>
            <Select value={selectedCategory || undefined} onValueChange={(value) => setSelectedCategory(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {Array.isArray(categories) && categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 overflow-y-auto p-1">
            {loading && variants.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-20">
                <div className="text-muted-foreground">Chargement des produits...</div>
              </div>
            ) : variants.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-20">
                <div className="text-muted-foreground">Aucun produit trouvé</div>
              </div>
            ) : (
              variants.map(variant => (
                <Card
                  key={variant.id}
                  className="cursor-pointer transition-all duration-200 border-2 hover:border-primary hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                  onClick={() => addToCart(variant)}
                >
                  <CardContent className="p-4">
                    <div className="w-full h-[120px] bg-muted/50 flex items-center justify-center rounded mb-3 overflow-hidden">
                      {variant.perfume_detail?.image ? (
                        <img src={variant.perfume_detail.image} alt={variant.perfume_detail.name} className="max-w-full max-h-full object-cover" />
                      ) : (
                        <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="font-semibold text-sm mb-1 truncate">{variant.perfume_detail?.name || 'Produit'}</div>
                    <div className="text-xs text-muted-foreground mb-2">{variant.size_ml}ml</div>
                    <div className="text-base font-bold text-primary">{parseFloat(variant.price_mad).toFixed(2)} MAD</div>
                    <span className={cn(
                      "text-xs font-medium",
                      variant.is_low_stock ? "text-destructive" : "text-green-600"
                    )}>
                      Stock: {variant.stock_qty}
                    </span>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <Card className="flex flex-col h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Caisses
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addNewCart} disabled={carts.length >= 3}>
                <Plus className="h-4 w-4 mr-1" />
                Nouveau
              </Button>
            </div>
            <div className="flex gap-3">
              {carts.map((cart) => (
                <div key={cart.id} className="relative group flex-1">
                  <Button
                    variant={activeCartId === cart.id ? "default" : "outline"}
                    className="w-full h-14 text-xl font-bold relative"
                    onClick={() => setActiveCartId(cart.id)}
                  >
                    {cart.name}
                    {cart.items.length > 0 && (
                      <span className="ml-2 text-sm">({cart.items.length})</span>
                    )}
                  </Button>
                  {carts.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCart(cart.id);
                      }}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {carts.map((cart) => (
              <div key={cart.id} className={cn("h-full flex flex-col", activeCartId === cart.id ? "flex" : "hidden")}>
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {cart.items.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
                        <div>Panier vide</div>
                      </div>
                    ) : (
                      cart.items.map(item => (
                        <CartItemComponent
                          key={item.variant.id}
                          item={item}
                          onUpdateQuantity={updateQuantity}
                          onRemove={removeFromCart}
                        />
                      ))
                    )}
                  </div>

                  <div className="flex-shrink-0 border-t pt-4 px-6 pb-6 bg-card">
                    <div className="flex justify-between mb-3 text-sm">
                      <span className='font-bold'>Articles:</span>
                      <span className='font-bold'>{cart.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between mb-4 text-xl font-bold text-primary">
                      <span>Total:</span>
                      <span>{cart.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)} MAD</span>
                    </div>
                    <Button
                      size="lg"
                      className="w-full transition-all duration-150 active:scale-95"
                      onClick={handleCheckout}
                      disabled={cart.items.length === 0 || loading}
                    >
                      Payer
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={paymentModalVisible} onOpenChange={setPaymentModalVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Méthode de paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between text-xl font-bold text-primary">
              <span>Total à payer:</span>
              <span>{calculateTotal().toFixed(2)} MAD</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
              >
                Espèces
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
              >
                Carte
              </Button>
              <Button
                variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('transfer')}
              >
                Virement
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentModalVisible(false)}>
              Annuler
            </Button>
            <Button onClick={processSale} disabled={loading}>
              Confirmer la vente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default POS;
