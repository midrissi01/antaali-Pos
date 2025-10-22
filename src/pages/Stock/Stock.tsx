import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, Send, RefreshCw } from 'lucide-react';
import { getVariants, getCategories } from '@/services/api';
import type { PerfumeVariant, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface StockRequest {
  variant: PerfumeVariant;
  quantity: number;
}

const Stock: React.FC = () => {
  const [variants, setVariants] = useState<PerfumeVariant[]>([]);
  const [filteredVariants, setFilteredVariants] = useState<PerfumeVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [stockRequests, setStockRequests] = useState<StockRequest[]>([]);
  const [toast, setToast] = useState<{message: string; type: string} | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchVariants();
  }, []);

  useEffect(() => {
    filterVariants();
  }, [variants, searchText, selectedCategory, stockFilter]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: string = 'success') => {
    setToast({ message, type });
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      showToast('Erreur lors du chargement des catégories', 'error');
    }
  };

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const response = await getVariants();
      setVariants(response.data);
    } catch (error) {
      showToast('Erreur lors du chargement du stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterVariants = () => {
    let filtered = [...variants];

    if (searchText) {
      filtered = filtered.filter(
        v =>
          v.perfume_detail?.name.toLowerCase().includes(searchText.toLowerCase()) ||
          v.barcode.toLowerCase().includes(searchText.toLowerCase()) ||
          v.sku.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(v => v.perfume_detail?.category === parseInt(selectedCategory));
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter(v => v.is_low_stock && v.stock_qty > 0);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(v => v.stock_qty === 0);
    }

    setFilteredVariants(filtered);
  };

  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleRequestStock = () => {
    const selectedVariants = variants.filter(v => selectedRows.has(v.id));
    if (selectedVariants.length === 0) {
      showToast('Veuillez sélectionner au moins un produit', 'warning');
      return;
    }

    const requests: StockRequest[] = selectedVariants.map(v => ({
      variant: v,
      quantity: v.low_stock_threshold * 2,
    }));

    setStockRequests(requests);
    setRequestModalVisible(true);
  };

  const updateRequestQuantity = (variantId: number, quantity: number) => {
    setStockRequests(prev =>
      prev.map(req =>
        req.variant.id === variantId ? { ...req, quantity } : req
      )
    );
  };

  const submitStockRequest = () => {
    const total = stockRequests.reduce((sum, req) => sum + req.quantity, 0);
    showToast(`Demande envoyée à l'usine principale: ${total} unités pour ${stockRequests.length} produits`, 'success');
    setRequestModalVisible(false);
    setSelectedRows(new Set());
    setStockRequests([]);
  };

  const calculateStats = () => {
    const total = variants.length;
    const lowStock = variants.filter(v => v.is_low_stock && v.stock_qty > 0).length;
    const outOfStock = variants.filter(v => v.stock_qty === 0).length;
    const totalValue = variants.reduce(
      (sum, v) => sum + parseFloat(v.price_mad) * v.stock_qty,
      0
    );

    return { total, lowStock, outOfStock, totalValue };
  };

  const stats = calculateStats();

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
          <h1 className="text-2xl font-semibold">Gestion du Stock</h1>
          <div className="flex gap-2">
            <Button
              onClick={handleRequestStock}
              disabled={selectedRows.size === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Demander Stock ({selectedRows.size})
            </Button>
            <Button variant="outline" onClick={fetchVariants} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="text-sm opacity-90 mb-2">Total Produits</div>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500 text-white">
            <CardContent className="p-6">
              <div className="text-sm opacity-90 mb-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> Stock Faible
              </div>
              <div className="text-3xl font-bold">{stats.lowStock}</div>
            </CardContent>
          </Card>
          <Card className="bg-destructive text-destructive-foreground">
            <CardContent className="p-6">
              <div className="text-sm opacity-90 mb-2">Rupture de Stock</div>
              <div className="text-3xl font-bold">{stats.outOfStock}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-600 text-white">
            <CardContent className="p-6">
              <div className="text-sm opacity-90 mb-2">Valeur Totale</div>
              <div className="text-3xl font-bold">{stats.totalValue.toFixed(0)} MAD</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher (nom, SKU, code-barres)"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory || undefined} onValueChange={(value) => setSelectedCategory(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={(value: any) => setStockFilter(value)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="low">Stock faible</SelectItem>
              <SelectItem value="out">Rupture</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Produit</TableHead>
                <TableHead className="w-24">Taille</TableHead>
                <TableHead className="w-32">SKU</TableHead>
                <TableHead className="w-32">Code-barres</TableHead>
                <TableHead className="w-28">Prix (MAD)</TableHead>
                <TableHead className="w-24">Stock</TableHead>
                <TableHead className="w-24">Seuil</TableHead>
                <TableHead className="w-32">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVariants.map(variant => (
                <TableRow key={variant.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(variant.id)}
                      onChange={() => handleSelectRow(variant.id)}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{variant.perfume_detail?.name}</TableCell>
                  <TableCell>{variant.size_ml}ml</TableCell>
                  <TableCell>{variant.sku}</TableCell>
                  <TableCell>{variant.barcode}</TableCell>
                  <TableCell>{parseFloat(variant.price_mad).toFixed(2)}</TableCell>
                  <TableCell className="font-bold">
                    {variant.stock_qty}
                    {variant.is_low_stock && variant.stock_qty > 0 && (
                      <AlertTriangle className="inline ml-1 h-4 w-4 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell>{variant.low_stock_threshold}</TableCell>
                  <TableCell>
                    {variant.stock_qty === 0 ? (
                      <span className="inline-block bg-gray-400 text-white px-2 py-1 rounded text-xs">Rupture</span>
                    ) : variant.is_low_stock ? (
                      <span className="inline-block bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs">Stock faible</span>
                    ) : (
                      <span className="inline-block bg-green-600 text-white px-2 py-1 rounded text-xs">En stock</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={requestModalVisible} onOpenChange={setRequestModalVisible}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Demande de Réapprovisionnement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Veuillez confirmer les quantités à commander à l'usine principale:
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Stock actuel</TableHead>
                <TableHead>Quantité demandée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockRequests.map(req => (
                <TableRow key={req.variant.id}>
                  <TableCell>{req.variant.perfume_detail?.name}</TableCell>
                  <TableCell>{req.variant.size_ml}ml</TableCell>
                  <TableCell>{req.variant.stock_qty}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={req.quantity}
                      onChange={(e) => updateRequestQuantity(req.variant.id, parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 text-right font-bold">
            Total à commander: {stockRequests.reduce((sum, req) => sum + req.quantity, 0)} unités
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestModalVisible(false)}>
              Annuler
            </Button>
            <Button onClick={submitStockRequest}>
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Stock;
