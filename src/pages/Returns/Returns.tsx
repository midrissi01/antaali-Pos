import React, { useState, useEffect } from 'react';
import { RefreshCw, RotateCcw, Search, Plus, Minus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import dayjs from 'dayjs';
import { getReturns, getSales, createReturn, getVariants } from '@/services/api';
import type { Return, Sale, ReturnReason, PerfumeVariant, CartItem, CreateReturn } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const Returns: React.FC = () => {
  const [returns, setReturns] = useState<Return[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string; type: string} | null>(null);

  // Modal states
  const [newReturnModalVisible, setNewReturnModalVisible] = useState(false);
  const [step, setStep] = useState<'select-sale' | 'select-items' | 'operation-type' | 'exchange' | 'summary'>(
'select-sale'
  );

  // Return form data
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleSearchText, setSaleSearchText] = useState('');
  const [selectedReturnItems, setSelectedReturnItems] = useState<{saleItemId: number; quantity: number}[]>([]);
  const [operationType, setOperationType] = useState<'refund' | 'exchange'>('refund');
  const [returnReason, setReturnReason] = useState<ReturnReason>('customer_request');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');

  // Exchange items
  const [exchangeItems, setExchangeItems] = useState<CartItem[]>([]);
  const [variants, setVariants] = useState<PerfumeVariant[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchReturns();
    fetchSales();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: string = 'success') => {
    setToast({ message, type });
  };

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await getReturns();
      // Handle both direct array and paginated response
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.results || [];
      setReturns(data);
    } catch (error) {
      showToast('Erreur lors du chargement des retours', 'error');
      setReturns([]); // Ensure returns is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await getSales();
      // Handle both direct array and paginated response
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.results || [];
      setSales(data);
    } catch (error) {
      showToast('Erreur lors du chargement des ventes', 'error');
      setSales([]); // Ensure sales is always an array
    }
  };

  const fetchVariants = async () => {
    try {
      const response = await getVariants({ search: searchText || undefined });
      // Handle both direct array and paginated response
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.results || [];
      setVariants(data.filter(v => v.is_active && v.is_in_stock));
    } catch (error) {
      showToast('Erreur lors du chargement des produits', 'error');
      setVariants([]); // Ensure variants is always an array
    }
  };

  useEffect(() => {
    if (step === 'exchange') {
      fetchVariants();
    }
  }, [step]);

  useEffect(() => {
    if (step === 'exchange') {
      const handler = setTimeout(() => {
        fetchVariants();
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [searchText]);

  const resetForm = () => {
    setStep('select-sale');
    setSelectedSale(null);
    setSaleSearchText('');
    setSelectedReturnItems([]);
    setOperationType('refund');
    setReturnReason('customer_request');
    setPaymentMethod('cash');
    setExchangeItems([]);
    setSearchText('');
    setVariants([]);
  };

  const openNewReturnModal = () => {
    resetForm();
    setNewReturnModalVisible(true);
  };

  const closeNewReturnModal = () => {
    setNewReturnModalVisible(false);
    resetForm();
  };

  const hasReturn = (saleId: number): boolean => {
    return returns.some(returnItem => returnItem.sale === saleId);
  };

  const selectSale = (sale: Sale) => {
    // Check if this sale already has a return
    if (hasReturn(sale.id)) {
      showToast('Cette vente a déjà fait l\'objet d\'un retour/échange. Une vente ne peut être retournée qu\'une seule fois.', 'error');
      return;
    }
    setSelectedSale(sale);
    setStep('select-items');
  };

  const toggleReturnItem = (saleItemId: number) => {
    const exists = selectedReturnItems.find(item => item.saleItemId === saleItemId);
    if (exists) {
      setSelectedReturnItems(selectedReturnItems.filter(item => item.saleItemId !== saleItemId));
    } else {
      const saleItem = selectedSale?.items.find(item => item.id === saleItemId);
      if (saleItem) {
        setSelectedReturnItems([...selectedReturnItems, { saleItemId, quantity: saleItem.quantity }]);
      }
    }
  };

  const updateReturnItemQuantity = (saleItemId: number, quantity: number) => {
    const saleItem = selectedSale?.items.find(item => item.id === saleItemId);
    if (!saleItem) return;

    const validQuantity = Math.min(Math.max(1, quantity), saleItem.quantity);
    setSelectedReturnItems(
      selectedReturnItems.map(item =>
        item.saleItemId === saleItemId ? { ...item, quantity: validQuantity } : item
      )
    );
  };

  const addToExchange = (variant: PerfumeVariant) => {
    const existingItem = exchangeItems.find(item => item.variant.id === variant.id);

    if (existingItem) {
      if (existingItem.quantity >= variant.stock_qty) {
        showToast('Stock insuffisant', 'warning');
        return;
      }
      setExchangeItems(
        exchangeItems.map(item =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * parseFloat(item.variant.price_mad) }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        variant,
        quantity: 1,
        subtotal: parseFloat(variant.price_mad),
      };
      setExchangeItems([...exchangeItems, newItem]);
    }
  };

  const updateExchangeQuantity = (variantId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromExchange(variantId);
      return;
    }

    const item = exchangeItems.find(i => i.variant.id === variantId);
    if (item && newQuantity > item.variant.stock_qty) {
      showToast('Stock insuffisant', 'warning');
      return;
    }

    setExchangeItems(
      exchangeItems.map(item =>
        item.variant.id === variantId
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * parseFloat(item.variant.price_mad) }
          : item
      )
    );
  };

  const removeFromExchange = (variantId: number) => {
    setExchangeItems(exchangeItems.filter(item => item.variant.id !== variantId));
  };

  const calculateReturnTotal = () => {
    if (!selectedSale) return 0;
    return selectedReturnItems.reduce((sum, returnItem) => {
      const saleItem = selectedSale.items.find(item => item.id === returnItem.saleItemId);
      if (!saleItem) return sum;
      return sum + (parseFloat(saleItem.unit_price) * returnItem.quantity);
    }, 0);
  };

  const calculateExchangeTotal = () => {
    return exchangeItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateDifference = () => {
    const returnTotal = calculateReturnTotal();
    const exchangeTotal = operationType === 'exchange' ? calculateExchangeTotal() : 0;
    return returnTotal - exchangeTotal;
  };

  const handleSubmitReturn = async () => {
    if (!selectedSale || selectedReturnItems.length === 0) {
      showToast('Veuillez sélectionner au moins un article à retourner', 'error');
      return;
    }

    if (operationType === 'exchange' && exchangeItems.length === 0) {
      showToast('Veuillez sélectionner au moins un article d\'échange', 'error');
      return;
    }

    try {
      setLoading(true);

      const returnData: CreateReturn = {
        sale: selectedSale.id,
        return_items: selectedReturnItems.map(item => ({
          sale_item: item.saleItemId,
          quantity: item.quantity,
        })),
        reason: returnReason,
        operation_type: operationType,
        exchange_items: operationType === 'exchange' ? exchangeItems.map(item => ({
          variant: item.variant.id,
          quantity: item.quantity,
        })) : undefined,
        payment_method: paymentMethod,
      };

      await createReturn(returnData);
      showToast('Retour/Échange effectué avec succès', 'success');
      closeNewReturnModal();
      fetchReturns();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Erreur lors de la création du retour';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getReasonLabel = (reason: ReturnReason): string => {
    const labels: Record<ReturnReason, string> = {
      customer_request: 'Demande du client',
      damaged_product: 'Produit endommagé',
      wrong_product: 'Mauvais produit',
      quality_issue: 'Problème de qualité',
      other: 'Autre',
    };
    return labels[reason] || reason;
  };

  const filteredSales = sales.filter(sale => {
    const searchLower = saleSearchText.toLowerCase();
    const saleNumber = sale.id.toString().padStart(5, '0');
    const cashierName = sale.cashier_name?.toLowerCase() || '';
    return saleNumber.includes(searchLower) || cashierName.includes(searchLower);
  });

  const filteredVariants = variants.filter(variant => {
    const searchLower = searchText.toLowerCase();
    const perfumeName = variant.perfume_detail?.name?.toLowerCase() || '';
    const sizeMl = variant.size_ml?.toString() || '';
    return perfumeName.includes(searchLower) || sizeMl.includes(searchLower);
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Retours & Échanges</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchReturns} disabled={loading}>
            <RefreshCw className={cn("h-5 w-5 mr-2", loading && "animate-spin")} />
            Actualiser
          </Button>
          <Button onClick={openNewReturnModal}>
            <RotateCcw className="h-5 w-5 mr-2" />
            Nouveau Retour/Échange
          </Button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all",
          toast.type === 'success' && "bg-green-500 text-white",
          toast.type === 'error' && "bg-red-500 text-white",
          toast.type === 'warning' && "bg-yellow-500 text-white"
        )}>
          {toast.message}
        </div>
      )}

      {/* Returns List */}
      <Card>
        <CardContent className="p-6">
          {loading && returns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : returns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucun retour enregistré</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Retour</TableHead>
                    <TableHead>N° Vente</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((returnItem) => (
                    <TableRow key={returnItem.id}>
                      <TableCell className="font-mono">#{returnItem.id.toString().padStart(5, '0')}</TableCell>
                      <TableCell className="font-mono">#{returnItem.sale.toString().padStart(5, '0')}</TableCell>
                      <TableCell>{dayjs(returnItem.created_at).format('DD/MM/YYYY HH:mm')}</TableCell>
                      <TableCell>{returnItem.operation_type === 'refund' ? 'Remboursement' : 'Échange'}</TableCell>
                      <TableCell>{getReasonLabel(returnItem.reason)}</TableCell>
                      <TableCell className="font-semibold">{parseFloat(returnItem.return_total).toFixed(2)} MAD</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Return/Exchange Modal */}
      <Dialog open={newReturnModalVisible} onOpenChange={closeNewReturnModal}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-[90vw] lg:max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Nouveau Retour/Échange</DialogTitle>
          </DialogHeader>

          {step === 'select-sale' && (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="N° de vente ou nom du caissier"
                  value={saleSearchText}
                  onChange={(e) => setSaleSearchText(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Ventes récentes</h3>
                
                {/* CORRECTION: Conteneur avec scroll horizontal pour le tableau */}
                <div className="overflow-x-auto -mx-6 px-6">
                  <div className="min-w-[800px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">N° Vente</TableHead>
                          <TableHead className="w-[180px]">Date</TableHead>
                          <TableHead className="w-[150px]">Caissier</TableHead>
                          <TableHead className="w-[120px] text-right">Montant</TableHead>
                          <TableHead className="w-[120px]">Paiement</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSales.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Aucune vente trouvée
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredSales.map((sale) => {
                            const alreadyReturned = hasReturn(sale.id);
                            return (
                              <TableRow
                                key={sale.id}
                                className={cn(
                                  "transition-colors",
                                  alreadyReturned
                                    ? "opacity-50 cursor-not-allowed bg-muted/30"
                                    : "cursor-pointer hover:bg-muted/50"
                                )}
                                onClick={() => selectSale(sale)}
                              >
                                <TableCell className="font-mono font-semibold">
                                  #{sale.id.toString().padStart(5, '0')}
                                  {alreadyReturned && (
                                    <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                      Retourné
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>{dayjs(sale.created_at).format('DD/MM/YYYY HH:mm')}</TableCell>
                                <TableCell>{sale.cashier_name || 'N/A'}</TableCell>
                                <TableCell className="text-right font-semibold">{parseFloat(sale.total_amount).toFixed(2)} MAD</TableCell>
                                <TableCell className="capitalize">{sale.payment_method === 'cash' ? 'Espèces' : sale.payment_method === 'card' ? 'Carte' : 'Virement'}</TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'select-items' && selectedSale && (
            <div className="space-y-6">
              <Button variant="ghost" size="default" onClick={() => setStep('select-sale')}>
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Button>

              <div className="bg-muted/30 p-5 rounded-lg">
                <div className="text-lg font-semibold mb-2">Vente #{selectedSale.id.toString().padStart(5, '0')}</div>
                <div className="text-sm text-muted-foreground">
                  Caissier: {selectedSale.cashier_name} | Paiement: {selectedSale.payment_method} | Total: {parseFloat(selectedSale.total_amount).toFixed(2)} MAD
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Articles à retourner</h3>
                
                {/* CORRECTION: Scroll horizontal pour les articles */}
                <div className="overflow-x-auto -mx-6 px-6">
                  <div className="min-w-[700px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead className="w-[250px]">Produit</TableHead>
                          <TableHead className="w-[100px]">Taille</TableHead>
                          <TableHead className="w-[120px] text-right">Prix Unit.</TableHead>
                          <TableHead className="w-[100px]">Qté Vendue</TableHead>
                          <TableHead className="w-[150px]">Qté Retour</TableHead>
                          <TableHead className="w-[120px] text-right">Sous-total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSale.items.map((item) => {
                          const returnItem = selectedReturnItems.find(r => r.saleItemId === item.id);
                          const isSelected = !!returnItem;
                          
                          return (
                            <TableRow key={item.id} className={cn(isSelected && "bg-primary/5")}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleReturnItem(item.id)}
                                  className="h-5 w-5 cursor-pointer"
                                />
                              </TableCell>
                              <TableCell className="font-medium">{item.variant_detail?.perfume_detail?.name}</TableCell>
                              <TableCell>{item.variant_detail?.size_ml}ml</TableCell>
                              <TableCell className="text-right">{parseFloat(item.unit_price).toFixed(2)} MAD</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                {isSelected ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => updateReturnItemQuantity(item.id, returnItem.quantity - 1)}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-10 text-center font-semibold">{returnItem.quantity}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => updateReturnItemQuantity(item.id, returnItem.quantity + 1)}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {isSelected ? `${(parseFloat(item.unit_price) * returnItem.quantity).toFixed(2)} MAD` : '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded">
                <div className="flex justify-between items-center text-xl">
                  <span className="font-bold">Total Retour:</span>
                  <span className="font-bold text-2xl">{calculateReturnTotal().toFixed(2)} MAD</span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep('select-sale')} size="lg" className="text-base">
                  Annuler
                </Button>
                <Button
                  onClick={() => setStep('operation-type')}
                  disabled={selectedReturnItems.length === 0}
                  size="lg"
                  className="text-base"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {step === 'operation-type' && (
            <div className="space-y-6">
              <Button variant="ghost" size="default" onClick={() => setStep('select-items')}>
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Button>

              <div className="space-y-5">
                <div>
                  <label className="text-base font-semibold mb-3 block">Type d'opération</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        operationType === 'refund' && "ring-2 ring-primary bg-primary/5"
                      )}
                      onClick={() => setOperationType('refund')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">💰</div>
                        <div className="font-bold text-xl mb-2">Remboursement</div>
                        <div className="text-sm text-muted-foreground">Le client récupère l'argent</div>
                      </CardContent>
                    </Card>

                    <Card
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        operationType === 'exchange' && "ring-2 ring-primary bg-primary/5"
                      )}
                      onClick={() => setOperationType('exchange')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">🔄</div>
                        <div className="font-bold text-xl mb-2">Échange</div>
                        <div className="text-sm text-muted-foreground">Le client échange contre d'autres produits</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <label className="text-base font-semibold mb-3 block">Motif du retour</label>
                  <Select value={returnReason} onValueChange={(value: ReturnReason) => setReturnReason(value)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer_request">Demande du client</SelectItem>
                      <SelectItem value="damaged_product">Produit endommagé</SelectItem>
                      <SelectItem value="wrong_product">Mauvais produit</SelectItem>
                      <SelectItem value="quality_issue">Problème de qualité</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep('select-items')} size="lg" className="text-base">
                  Retour
                </Button>
                <Button
                  onClick={() => operationType === 'exchange' ? setStep('exchange') : setStep('summary')}
                  size="lg"
                  className="text-base"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {step === 'exchange' && (
            <div className="space-y-6">
              <Button variant="ghost" size="default" onClick={() => setStep('operation-type')}>
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Button>

              {/* CORRECTION MAJEURE: Changement de grid-cols-2 en layout flexible responsive */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Catalogue des produits - Prend toute la largeur sur mobile, 60% sur desktop */}
                <div className="flex-1 lg:flex-[3] border rounded-lg p-5 space-y-4">
                  <div className="font-bold text-lg mb-3">Catalogue</div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10 h-12 text-base"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto">
                    {filteredVariants.length === 0 ? (
                      <div className="col-span-full text-center py-12 text-base text-muted-foreground">
                        Aucun produit trouvé
                      </div>
                    ) : (
                      filteredVariants.map((variant) => (
                        <Card
                          key={variant.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => addToExchange(variant)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="w-full h-28 flex items-center justify-center mb-3 bg-muted/20 rounded">
                              {variant.perfume_detail?.image ? (
                                <img
                                  src={variant.perfume_detail.image}
                                  alt={variant.perfume_detail.name}
                                  className="max-h-24 max-w-full object-contain"
                                />
                              ) : (
                                <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                              )}
                            </div>
                            <div className="font-semibold text-sm mb-1 truncate">{variant.perfume_detail?.name}</div>
                            <div className="text-sm text-muted-foreground mb-1">{variant.size_ml}ml</div>
                            <div className="text-base font-bold text-primary">{parseFloat(variant.price_mad).toFixed(2)} MAD</div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Articles d'échange - Prend toute la largeur sur mobile, 40% sur desktop */}
                <div className="flex-1 lg:flex-[2] border rounded-lg p-5 space-y-4">
                  <div className="font-bold text-lg mb-3">Articles d'échange</div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {exchangeItems.length === 0 ? (
                      <div className="text-center py-12 text-base text-muted-foreground">
                        Aucun article sélectionné
                      </div>
                    ) : (
                      exchangeItems.map(item => (
                        <div key={item.variant.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{item.variant.perfume_detail?.name}</div>
                            <div className="text-sm text-muted-foreground">{item.variant.size_ml}ml - {parseFloat(item.variant.price_mad).toFixed(2)} MAD</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateExchangeQuantity(item.variant.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center text-base font-semibold">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateExchangeQuantity(item.variant.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeFromExchange(item.variant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t pt-4 mt-4 text-right text-xl font-bold">
                    Total: {calculateExchangeTotal().toFixed(2)} MAD
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep('operation-type')} size="lg" className="text-base w-full sm:w-auto">
                  Retour
                </Button>
                <Button
                  onClick={() => setStep('summary')}
                  disabled={exchangeItems.length === 0}
                  size="lg"
                  className="text-base w-full sm:w-auto"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {step === 'summary' && (
            <div className="space-y-6">
              <Button variant="ghost" size="default" onClick={() => setStep(operationType === 'exchange' ? 'exchange' : 'operation-type')}>
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Button>

              <div className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-lg">
                  <h3 className="font-bold text-xl mb-4">Récapitulatif</h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground font-medium">Vente originale:</span>
                      <span className="font-mono font-semibold">#{selectedSale?.id.toString().padStart(5, '0')}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground font-medium">Type:</span>
                      <span className="font-semibold">{operationType === 'refund' ? 'Remboursement' : 'Échange'}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground font-medium">Motif:</span>
                      <span className="font-semibold">{getReasonLabel(returnReason)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-lg">
                      <span className="font-medium">Total retour:</span>
                      <span className="font-bold text-green-600 text-xl">+{calculateReturnTotal().toFixed(2)} MAD</span>
                    </div>
                    {operationType === 'exchange' && (
                      <div className="flex justify-between text-lg">
                        <span className="font-medium">Total échange:</span>
                        <span className="font-bold text-red-600 text-xl">-{calculateExchangeTotal().toFixed(2)} MAD</span>
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between text-xl">
                      <span className="font-bold">Différence:</span>
                      <span className={cn(
                        "font-bold text-2xl",
                        calculateDifference() > 0 ? "text-green-600" : calculateDifference() < 0 ? "text-red-600" : ""
                      )}>
                        {calculateDifference() > 0 ? '+' : ''}{calculateDifference().toFixed(2)} MAD
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 p-5 rounded-lg bg-primary/10">
                    {calculateDifference() > 0 ? (
                      <div className="text-base">
                        <span className="font-semibold">⬅️ Remboursement au client: </span>
                        <span className="text-2xl font-bold text-green-600">{calculateDifference().toFixed(2)} MAD</span>
                      </div>
                    ) : calculateDifference() < 0 ? (
                      <div className="text-base">
                        <span className="font-semibold">➡️ Client doit payer: </span>
                        <span className="text-2xl font-bold text-red-600">{Math.abs(calculateDifference()).toFixed(2)} MAD</span>
                      </div>
                    ) : (
                      <div className="text-base font-bold">
                        ✅ Pas de différence à payer
                      </div>
                    )}
                  </div>
                </div>

                {calculateDifference() !== 0 && (
                  <div>
                    <label className="text-base font-semibold mb-3 block">Méthode de paiement/remboursement</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button
                        variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('cash')}
                        size="lg"
                        className="text-base h-14"
                      >
                        Espèces
                      </Button>
                      <Button
                        variant={paymentMethod === 'card' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('card')}
                        size="lg"
                        className="text-base h-14"
                      >
                        Carte
                      </Button>
                      <Button
                        variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('transfer')}
                        size="lg"
                        className="text-base h-14"
                      >
                        Virement
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-3 flex-col sm:flex-row">
                <Button variant="outline" onClick={closeNewReturnModal} size="lg" className="text-base w-full sm:w-auto">
                  Annuler
                </Button>
                <Button onClick={handleSubmitReturn} disabled={loading} size="lg" className="text-base w-full sm:w-auto">
                  Confirmer l'opération
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Returns;