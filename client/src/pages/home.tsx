import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TimeDisplay } from "@/components/time-display";
import { CategoryList } from "@/components/category-list";
import { AddItemModal } from "@/components/add-item-modal";
import { EditCategoryModal } from "@/components/edit-category-modal";
import { EditItemModal } from "@/components/edit-item-modal";
import { Plus } from "lucide-react";
import { type Category, type Item } from "@shared/schema";

export default function Home() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-medium text-foreground">Essential Tracker</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 min-h-screen">
        <TimeDisplay />
        <CategoryList 
          categories={categories}
          items={items}
          onEditCategory={setEditingCategory}
          onEditItem={setEditingItem}
        />
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-primary/30 z-40"
      >
        <Plus className="w-6 h-6 mx-auto" />
      </button>

      {/* Modals */}
      <AddItemModal 
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
      />

      <EditCategoryModal
        category={editingCategory}
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
      />

      <EditItemModal
        item={editingItem}
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        categories={categories}
      />
    </div>
  );
}
