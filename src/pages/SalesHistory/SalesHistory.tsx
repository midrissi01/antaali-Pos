import React, { useState, useEffect } from 'react';
import { Eye, RefreshCw, DollarSign, ShoppingBag, RotateCcw } from 'lucide-react';
import dayjs from 'dayjs';
import { getSales, getReturns } from '@/services/api';
import type { Sale, Return } from '@/types';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

const SalesHistory: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [toast, setToast] = useState<{message: string; type: string} | null>(null);

  useEffect(() => {
    fetchSales();
    fetchReturns();
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

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await getSales();
      setSales(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showToast('Erreur lors du chargement des ventes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchReturns = async () => {
    try {
      const response = await getReturns();
      setReturns(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des retours', error);
    }
  };

  const getSaleReturns = (saleId: number) => {
    return returns.filter(r => r.sale === saleId);
  };

  const showSaleDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setDetailModalVisible(true);
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

  const getPaymentBadgeColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'bg-green-600 text-white';
      case 'card':
        return 'bg-blue-600 text-white';
      case 'transfer':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const calculateStats = () => {
    const salesArray = Array.isArray(sales) ? sales : [];
    const totalSales = salesArray.length;
    const totalRevenue = salesArray.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const totalItems = salesArray.reduce(
      (sum, sale) => sum + (Array.isArray(sale.items) ? sale.items.reduce((s, item) => s + item.quantity, 0) : 0),
      0
    );
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    return { totalSales, totalRevenue, totalItems, averageSale };
  };

  const stats = calculateStats();

  return (
    <>
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg",
          toast.type === 'success' && "bg-green-600 text-white",
          toast.type === 'error' && "bg-destructive text-destructive-foreground"
        )}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Historique des Ventes</h1>
          <Button variant="outline" onClick={fetchSales} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="text-sm opacity-90 mb-2">Total Ventes</div>
              <div className="text-3xl font-bold">{stats.totalSales}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-600 text-white">
            <CardContent className="p-6">
              <div className="text-sm opacity-90 mb-2 flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Chiffre d'Affaires
              </div>
              <div className="text-3xl font-bold">{stats.totalRevenue.toFixed(0)} MAD</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-600 text-white">
            <CardContent className="p-6">
              <div className="text-sm opacity-90 mb-2 flex items-center gap-1">
                <ShoppingBag className="h-4 w-4" /> Articles Vendus
              </div>
              <div className="text-3xl font-bold">{stats.totalItems}</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500 text-white">
            <CardContent className="p-6">
              <div className="text-sm opacity-90 mb-2">Panier Moyen</div>
              <div className="text-3xl font-bold">{stats.averageSale.toFixed(0)} MAD</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">N° Vente</TableHead>
                <TableHead className="w-40">Date & Heure</TableHead>
                <TableHead className="w-36">Caissier</TableHead>
                <TableHead className="w-28">Articles</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead className="w-36">Montant Total</TableHead>
                <TableHead className="w-32">Paiement</TableHead>
                <TableHead className="w-32">Statut</TableHead>
                <TableHead className="w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map(sale => {
                const totalQty = sale.items.reduce((sum, item) => sum + item.quantity, 0);
                const products = sale.items
                  .map(item => item.variant_detail?.perfume_detail?.name)
                  .filter(Boolean)
                  .join(', ');

                const saleReturns = getSaleReturns(sale.id);
                const hasReturn = saleReturns.length > 0;

                return (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono">
                      #{sale.id.toString().padStart(5, '0')}
                    </TableCell>
                    <TableCell>
                      {dayjs(sale.created_at).format('DD/MM/YYYY HH:mm')}
                    </TableCell>
                    <TableCell>{sale.cashier_name}</TableCell>
                    <TableCell>
                      {totalQty} unité{totalQty > 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {products || '-'}
                    </TableCell>
                    <TableCell className="font-bold">
                      {parseFloat(sale.total_amount).toFixed(2)} MAD
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-block px-3 py-1 rounded text-xs font-medium",
                        getPaymentBadgeColor(sale.payment_method)
                      )}>
                        {getPaymentMethodLabel(sale.payment_method)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {hasReturn ? (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                            <RotateCcw className="h-3 w-3" />
                            {saleReturns.length > 1 ? `${saleReturns.length} retours` : 'Retour'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showSaleDetails(sale)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={detailModalVisible} onOpenChange={setDetailModalVisible}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              Détails de la vente #{selectedSale?.id.toString().padStart(5, '0')}
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <strong className="text-sm text-muted-foreground">Date & Heure:</strong>
                  <div className="text-sm mt-1">
                    {dayjs(selectedSale.created_at).format('DD/MM/YYYY HH:mm:ss')}
                  </div>
                </div>
                <div>
                  <strong className="text-sm text-muted-foreground">Caissier:</strong>
                  <div className="text-sm mt-1">{selectedSale.cashier_name}</div>
                </div>
                <div>
                  <strong className="text-sm text-muted-foreground">Mode de paiement:</strong>
                  <div className="mt-1">
                    <span className={cn(
                      "inline-block px-3 py-1 rounded text-xs font-medium",
                      getPaymentBadgeColor(selectedSale.payment_method)
                    )}>
                      {getPaymentMethodLabel(selectedSale.payment_method)}
                    </span>
                  </div>
                </div>
                <div>
                  <strong className="text-sm text-muted-foreground">N° de vente:</strong>
                  <div className="text-sm mt-1 font-mono">
                    #{selectedSale.id.toString().padStart(5, '0')}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold mb-3">Articles vendus</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="w-24">Taille</TableHead>
                      <TableHead className="w-24">Quantité</TableHead>
                      <TableHead className="w-32">Prix unitaire</TableHead>
                      <TableHead className="w-32">Sous-total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.variant_detail?.perfume_detail?.name}</TableCell>
                        <TableCell>{item.variant_detail?.size_ml}ml</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{parseFloat(item.unit_price).toFixed(2)} MAD</TableCell>
                        <TableCell className="font-bold">
                          {parseFloat(item.subtotal).toFixed(2)} MAD
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="text-right text-xl font-bold pt-4 border-t-2">
                Total: {parseFloat(selectedSale.total_amount).toFixed(2)} MAD
              </div>

              {(() => {
                const saleReturns = getSaleReturns(selectedSale.id);
                if (saleReturns.length > 0) {
                  return (
                    <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <RotateCcw className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold text-orange-900">
                          {saleReturns.length > 1 ? `${saleReturns.length} Retours/Échanges associés` : 'Retour/Échange associé'}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {saleReturns.map(returnItem => (
                          <div key={returnItem.id} className="bg-white p-3 rounded border border-orange-100">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-sm font-medium">
                                  Retour #{returnItem.id.toString().padStart(5, '0')}
                                </span>
                                <span className={cn(
                                  "ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium",
                                  returnItem.operation_type === 'refund'
                                    ? "bg-red-100 text-red-700"
                                    : "bg-blue-100 text-blue-700"
                                )}>
                                  {returnItem.operation_type === 'refund' ? 'Remboursement' : 'Échange'}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {dayjs(returnItem.created_at).format('DD/MM/YYYY HH:mm')}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Retour:</span>
                                <span className="ml-1 font-medium text-green-600">
                                  +{parseFloat(returnItem.return_total).toFixed(2)} MAD
                                </span>
                              </div>
                              {returnItem.operation_type === 'exchange' && (
                                <div>
                                  <span className="text-muted-foreground">Échange:</span>
                                  <span className="ml-1 font-medium text-red-600">
                                    -{parseFloat(returnItem.exchange_total).toFixed(2)} MAD
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">Différence:</span>
                                <span className={cn(
                                  "ml-1 font-medium",
                                  parseFloat(returnItem.difference) > 0
                                    ? "text-green-600"
                                    : parseFloat(returnItem.difference) < 0
                                    ? "text-red-600"
                                    : ""
                                )}>
                                  {parseFloat(returnItem.difference) > 0 ? '+' : ''}
                                  {parseFloat(returnItem.difference).toFixed(2)} MAD
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailModalVisible(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SalesHistory;
