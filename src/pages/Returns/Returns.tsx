import React, { useState, useEffect } from 'react';
import { RefreshCw, RotateCcw, Search, Plus, Minus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import dayjs from 'dayjs';
import { getReturns, getSales, createReturn, getVariants } from '@/services/api';
import type { Return, Sale, ReturnReason, PerfumeVariant, CartItem } from '@/types';
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
      setReturns(response.data);
    } catch (error) {
      showToast('Erreur lors du chargement des retours', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await getSales();
      setSales(response.data);
    } catch (error) {
      showToast('Erreur lors du chargement des ventes', 'error');
    }
  };

  const fetchVariants = async () => {
    try {
      const response = await getVariants({ search: searchText || undefined });
      setVariants(response.data.filter(v => v.is_active && v.is_in_stock));
    } catch (error) {
      showToast('Erreur lors du chargement des produits', 'error');
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

  const selectSale = (sale: Sale) => {
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
    setExchangeItems(
      exchangeItems.map(item => {
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
    );
  };

  const removeFromExchange = (variantId: number) => {
    setExchangeItems(exchangeItems.filter(item => item.variant.id !== variantId));
  };

  const calculateReturnTotal = () => {
    if (!selectedSale) return 0;
    return selectedReturnItems.reduce((sum, item) => {
      const saleItem = selectedSale.items.find(si => si.id === item.saleItemId);
      if (saleItem) {
        return sum + parseFloat(saleItem.unit_price) * item.quantity;
      }
      return sum;
    }, 0);
  };

  const calculateExchangeTotal = () => {
    return exchangeItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateDifference = () => {
    return calculateReturnTotal() - calculateExchangeTotal();
  };

  const handleSubmitReturn = async () => {
    if (!selectedSale || selectedReturnItems.length === 0) {
      showToast('Veuillez sélectionner au moins un article à retourner', 'warning');
      return;
    }

    if (operationType === 'exchange' && exchangeItems.length === 0) {
      showToast('Veuillez sélectionner au moins un article d\'échange', 'warning');
      return;
    }

    try {
      setLoading(true);
      await createReturn({
        sale: selectedSale.id,
        return_items: selectedReturnItems.map(item => ({
          sale_item: item.saleItemId,
          quantity: item.quantity,
        })),
        exchange_items: operationType === 'exchange' ? exchangeItems.map(item => ({
          variant: item.variant.id,
          quantity: item.quantity,
        })) : undefined,
        operation_type: operationType,
        reason: returnReason,
        payment_method: paymentMethod,
      });

      showToast('Retour/Échange enregistré avec succès', 'success');
      closeNewReturnModal();
      fetchReturns();
      fetchSales();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getReasonLabel = (reason: ReturnReason) => {
    switch (reason) {
      case 'defective':
        return 'Produit défectueux';
      case 'wrong_item':
        return 'Erreur de commande';
      case 'customer_request':
        return 'Demande du client';
      case 'other':
        return 'Autre';
      default:
        return reason;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Espèces';
      case 'card':
        return 'Carte';
      case 'transfer':
        return 'Virement';
      default:
        return method;
    }
  };

  const calculateStats = () => {
    const totalReturns = returns.length;
    const totalRefunded = returns
      .filter(r => r.operation_type === 'refund')
      .reduce((sum, r) => sum + parseFloat(r.return_total), 0);
    const totalExchanges = returns.filter(r => r.operation_type === 'exchange').length;
    const netDifference = returns.reduce((sum, r) => sum + parseFloat(r.difference), 0);

    return { totalReturns, totalRefunded, totalExchanges, netDifference };
  };

  const stats = calculateStats();

  const filteredSales = sales.filter(sale => {
    if (!saleSearchText) return true;
    const search = saleSearchText.toLowerCase();
    return (
      sale.id.toString().includes(search) ||
      sale.cashier_name.toLowerCase().includes(search)
    );
  });

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

      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Retours et Échanges</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchReturns} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Actualiser
            </Button>
            <Button onClick={openNewReturnModal}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Nouveau Retour/Échange
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="text-sm opacity-90 mb-2">Total Retours</div>
              <div className="text-3xl font-bold">{stats.totalReturns}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-600 text-white">
            <CardContent className="p-6">
              <div className="text-sm opacity-90 mb-2">Montant Remboursé</div>
              <div className="text-3xl font-bold">{stats.totalRefunded.toFixed(0)} MAD</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-6">
              <div className="text-sm opacity-90 mb-2">Nombre d'Échanges</div>
              <div className="text-3xl font-bold">{stats.totalExchanges}</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-600 text-white">
            <CardContent className="p-6">
              <div className="text-sm opacity-90 mb-2">Différence Nette</div>
              <div className="text-3xl font-bold">{stats.netDifference.toFixed(0)} MAD</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">N° Retour</TableHead>
                <TableHead className="w-32">Date</TableHead>
                <TableHead className="w-32">Vente Orig.</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead className="w-32">Motif</TableHead>
                <TableHead className="w-32">Total Retour</TableHead>
                <TableHead className="w-32">Total Échange</TableHead>
                <TableHead className="w-32">Différence</TableHead>
                <TableHead className="w-28">Caissier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    Aucun retour enregistré
                  </TableCell>
                </TableRow>
              ) : (
                returns.map(returnItem => (
                  <TableRow key={returnItem.id}>
                    <TableCell className="font-mono">
                      #{returnItem.id.toString().padStart(5, '0')}
                    </TableCell>
                    <TableCell>
                      {dayjs(returnItem.created_at).format('DD/MM/YYYY HH:mm')}
                    </TableCell>
                    <TableCell className="font-mono">
                      #{returnItem.sale.toString().padStart(5, '0')}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-block px-2 py-1 rounded text-xs font-medium",
                        returnItem.operation_type === 'refund' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {returnItem.operation_type === 'refund' ? 'Remboursement' : 'Échange'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{getReasonLabel(returnItem.reason)}</TableCell>
                    <TableCell className="font-medium">
                      {parseFloat(returnItem.return_total).toFixed(2)} MAD
                    </TableCell>
                    <TableCell className="font-medium">
                      {parseFloat(returnItem.exchange_total).toFixed(2)} MAD
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-bold",
                        parseFloat(returnItem.difference) > 0 ? "text-green-600" : parseFloat(returnItem.difference) < 0 ? "text-red-600" : ""
                      )}>
                        {parseFloat(returnItem.difference) > 0 ? '+' : ''}{parseFloat(returnItem.difference).toFixed(2)} MAD
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{returnItem.cashier_name}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={newReturnModalVisible} onOpenChange={setNewReturnModalVisible}>
        <DialogContent className="max-w-9xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Nouveau Retour/Échange</DialogTitle>
          </DialogHeader>

          {step === 'select-sale' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rechercher une vente</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="N° de vente ou nom du caissier"
                    value={saleSearchText}
                    onChange={(e) => setSaleSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ventes récentes</label>
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Vente</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Caissier</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Paiement</TableHead>
                        <TableHead className="w-24">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Aucune vente trouvée
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSales.map(sale => (
                          <TableRow
                            key={sale.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => selectSale(sale)}
                          >
                            <TableCell className="font-mono">#{sale.id.toString().padStart(5, '0')}</TableCell>
                            <TableCell>{dayjs(sale.created_at).format('DD/MM/YYYY HH:mm')}</TableCell>
                            <TableCell>{sale.cashier_name}</TableCell>
                            <TableCell className="font-bold">{parseFloat(sale.total_amount).toFixed(2)} MAD</TableCell>
                            <TableCell>{getPaymentMethodLabel(sale.payment_method)}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost">
                                Sélectionner
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {step === 'select-items' && selectedSale && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setStep('select-sale')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Vente #{selectedSale.id.toString().padStart(5, '0')}</span>
                  <span>{dayjs(selectedSale.created_at).format('DD/MM/YYYY HH:mm')}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Caissier: {selectedSale.cashier_name} | Paiement: {getPaymentMethodLabel(selectedSale.payment_method)} | Total: {parseFloat(selectedSale.total_amount).toFixed(2)} MAD
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Articles à retourner</label>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead className="w-24">Taille</TableHead>
                        <TableHead className="w-28">Prix Unit.</TableHead>
                        <TableHead className="w-32">Qté Vendue</TableHead>
                        <TableHead className="w-32">Qté Retour</TableHead>
                        <TableHead className="w-32">Sous-total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items.map(item => {
                        const selected = selectedReturnItems.find(ri => ri.saleItemId === item.id);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={!!selected}
                                onChange={() => toggleReturnItem(item.id!)}
                                className="w-4 h-4"
                              />
                            </TableCell>
                            <TableCell>{item.variant_detail?.perfume_detail?.name}</TableCell>
                            <TableCell>{item.variant_detail?.size_ml}ml</TableCell>
                            <TableCell>{parseFloat(item.unit_price).toFixed(2)} MAD</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              {selected ? (
                                <Input
                                  type="number"
                                  min={1}
                                  max={item.quantity}
                                  value={selected.quantity}
                                  onChange={(e) => updateReturnItemQuantity(item.id!, parseInt(e.target.value) || 1)}
                                  className="w-20"
                                />
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {selected ? (parseFloat(item.unit_price) * selected.quantity).toFixed(2) : '0.00'} MAD
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg text-right">
                <div className="text-lg font-bold">
                  Total Retour: {calculateReturnTotal().toFixed(2)} MAD
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Motif du retour</label>
                <Select value={returnReason} onValueChange={(value: ReturnReason) => setReturnReason(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defective">Produit défectueux</SelectItem>
                    <SelectItem value="wrong_item">Erreur de commande</SelectItem>
                    <SelectItem value="customer_request">Demande du client</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep('select-sale')}>
                  Annuler
                </Button>
                <Button
                  onClick={() => setStep('operation-type')}
                  disabled={selectedReturnItems.length === 0}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {step === 'operation-type' && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setStep('select-items')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <div>
                <label className="text-sm font-medium mb-3 block">Type d'opération</label>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={cn(
                      "cursor-pointer transition-all border-2",
                      operationType === 'refund' ? "border-primary bg-primary/5" : "border-border"
                    )}
                    onClick={() => setOperationType('refund')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-2">💵</div>
                      <div className="font-semibold mb-1">Remboursement</div>
                      <div className="text-sm text-muted-foreground">Retour uniquement</div>
                    </CardContent>
                  </Card>
                  <Card
                    className={cn(
                      "cursor-pointer transition-all border-2",
                      operationType === 'exchange' ? "border-primary bg-primary/5" : "border-border"
                    )}
                    onClick={() => setOperationType('exchange')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-2">🔄</div>
                      <div className="font-semibold mb-1">Échange</div>
                      <div className="text-sm text-muted-foreground">Contre d'autres produits</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep('select-items')}>
                  Retour
                </Button>
                <Button
                  onClick={() => {
                    if (operationType === 'exchange') {
                      setStep('exchange');
                    } else {
                      setStep('summary');
                    }
                  }}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {step === 'exchange' && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setStep('operation-type')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <div className="grid grid-cols-[1fr_350px] gap-4">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un produit"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                    {variants.map(variant => (
                      <Card
                        key={variant.id}
                        className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                        onClick={() => addToExchange(variant)}
                      >
                        <CardContent className="p-3">
                          <div className="w-full h-20 bg-muted/50 flex items-center justify-center rounded mb-2">
                            {variant.perfume_detail?.image ? (
                              <img src={variant.perfume_detail.image} alt={variant.perfume_detail.name} className="max-h-full" />
                            ) : (
                              <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                            )}
                          </div>
                          <div className="font-medium text-xs mb-1 truncate">{variant.perfume_detail?.name}</div>
                          <div className="text-xs text-muted-foreground">{variant.size_ml}ml</div>
                          <div className="text-sm font-bold text-primary">{parseFloat(variant.price_mad).toFixed(2)} MAD</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div className="font-semibold mb-2">Articles d'échange</div>
                  <div className="space-y-2 max-h-[320px] overflow-y-auto">
                    {exchangeItems.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Aucun article sélectionné
                      </div>
                    ) : (
                      exchangeItems.map(item => (
                        <div key={item.variant.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{item.variant.perfume_detail?.name}</div>
                            <div className="text-xs text-muted-foreground">{item.variant.size_ml}ml - {parseFloat(item.variant.price_mad).toFixed(2)} MAD</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateExchangeQuantity(item.variant.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateExchangeQuantity(item.variant.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => removeFromExchange(item.variant.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t pt-3 mt-3 text-right font-bold">
                    Total: {calculateExchangeTotal().toFixed(2)} MAD
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep('operation-type')}>
                  Retour
                </Button>
                <Button
                  onClick={() => setStep('summary')}
                  disabled={exchangeItems.length === 0}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {step === 'summary' && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setStep(operationType === 'exchange' ? 'exchange' : 'operation-type')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Récapitulatif</h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vente originale:</span>
                      <span className="font-mono">#{selectedSale?.id.toString().padStart(5, '0')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{operationType === 'refund' ? 'Remboursement' : 'Échange'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Motif:</span>
                      <span>{getReasonLabel(returnReason)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span>Total retour:</span>
                      <span className="font-bold text-green-600">+{calculateReturnTotal().toFixed(2)} MAD</span>
                    </div>
                    {operationType === 'exchange' && (
                      <div className="flex justify-between">
                        <span>Total échange:</span>
                        <span className="font-bold text-red-600">-{calculateExchangeTotal().toFixed(2)} MAD</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between text-lg">
                      <span className="font-semibold">Différence:</span>
                      <span className={cn(
                        "font-bold",
                        calculateDifference() > 0 ? "text-green-600" : calculateDifference() < 0 ? "text-red-600" : ""
                      )}>
                        {calculateDifference() > 0 ? '+' : ''}{calculateDifference().toFixed(2)} MAD
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-primary/10">
                    {calculateDifference() > 0 ? (
                      <div className="text-sm">
                        <span className="font-semibold">⬅️ Remboursement au client: </span>
                        <span className="text-lg font-bold text-green-600">{calculateDifference().toFixed(2)} MAD</span>
                      </div>
                    ) : calculateDifference() < 0 ? (
                      <div className="text-sm">
                        <span className="font-semibold">➡️ Client doit payer: </span>
                        <span className="text-lg font-bold text-red-600">{Math.abs(calculateDifference()).toFixed(2)} MAD</span>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold">
                        ✅ Pas de différence à payer
                      </div>
                    )}
                  </div>
                </div>

                {calculateDifference() !== 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Méthode de paiement/remboursement</label>
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
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeNewReturnModal}>
                  Annuler
                </Button>
                <Button onClick={handleSubmitReturn} disabled={loading}>
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
