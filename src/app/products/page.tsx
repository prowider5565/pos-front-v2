"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Package, Phone, Building2, Search, Plus } from "lucide-react"

import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { suppliersService, type Supplier, type SuppliersListResponse } from "@/services/suppliers.service"
import { ProductCreateDialog } from "./components/product-create-dialog"

export default function MahsulotlarSuppliersPage() {
  const { t } = useTranslation(['products', 'common'])
  const navigate = useNavigate()
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Memoized fetch function with search support
  const fetchSuppliers = useCallback(async (page: number, search?: string) => {
    setLoading(true)
    try {
      const params: { page: number; search?: string } = { page }
      if (search && search.trim()) {
        params.search = search.trim()
      }
      
      const response: SuppliersListResponse = await suppliersService.listSuppliers(params)
      setSuppliers(response.results)
      setTotalPages(response.total_pages)
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
      toast.error(t('common:messages.error'), {
        description: "Failed to load suppliers"
      })
    } finally {
      setLoading(false)
    }
  }, [t])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      // Reset to page 1 when searching
      if (searchQuery) {
        setCurrentPage(1)
      }
      fetchSuppliers(searchQuery ? 1 : currentPage, searchQuery)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery, currentPage, fetchSuppliers])

  const handleSupplierClick = (supplierId: number) => {
    navigate(`/products/${supplierId}`)
  }

  return (
    <BaseLayout>
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{t('suppliersTitle')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('suppliersTitle')}</h1>
            <p className="text-muted-foreground">{t('selectSupplierDescription')}</p>
          </div>

          {/* Search and Create Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchSuppliers')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="cursor-pointer"
            >
              <Plus className="mr-2 size-4" />
              {t('createProduct')}
            </Button>
          </div>
        </div>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : suppliers.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {suppliers.map((supplier) => (
            <Card
              key={supplier.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
              onClick={() => handleSupplierClick(supplier.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="line-clamp-1">{supplier.company_name}</span>
                  <Package className="size-5 text-muted-foreground flex-shrink-0" />
                </CardTitle>
                <CardDescription className="line-clamp-1">{supplier.full_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{supplier.phone_number}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {supplier.product_count || 0} {t('common:navigation.mahsulotlar').toLowerCase()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('common:messages.noResults')}</h3>
            <p className="text-sm text-muted-foreground">{t('common:messages.noData')}</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!loading && suppliers.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            {t('common:table.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('common:table.page')} {currentPage} {t('common:table.of')} {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            {t('common:table.next')}
          </Button>
        </div>
      )}
      </div>

      {/* Product Create Dialog */}
      <ProductCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          // Refresh suppliers list after product creation
          fetchSuppliers(currentPage, searchQuery)
        }}
      />
    </BaseLayout>
  )
}
