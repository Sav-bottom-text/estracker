import { useMutation } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Laptop, Utensils, Key, Box } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Category, type Item } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CategoryListProps {
  categories: Category[];
  items: Item[];
  onEditCategory: (category: Category) => void;
  onEditItem: (item: Item) => void;
}

const iconMap = {
  laptop: Laptop,
  utensils: Utensils,
  key: Key,
  box: Box,
};

export function CategoryList({ categories, items, onEditCategory, onEditItem }: CategoryListProps) {
  const { toast } = useToast();

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: Partial<Item> }) => {
      const res = await apiRequest("PUT", `/api/items/${itemId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      await apiRequest("DELETE", `/api/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Category deleted successfully" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("DELETE", `/api/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Item deleted successfully" });
    },
  });

  const toggleItemCheck = (item: Item) => {
    updateItemMutation.mutate({
      itemId: item.id,
      updates: { checked: !item.checked }
    });
  };

  const getCategoryItems = (categoryId: string) => {
    return items.filter(item => item.categoryId === categoryId);
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Box;
    return IconComponent;
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Box className="w-16 h-16 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium mb-2">No essentials yet</p>
        <p className="text-sm">Tap the + button to add your first essential item</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 space-y-4 pb-20">
      {categories.map((category) => {
        const categoryItems = getCategoryItems(category.id);
        const IconComponent = getIconComponent(category.icon);
        
        return (
          <div 
            key={category.id} 
            className={cn(
              "bg-white border rounded-lg overflow-hidden shadow-sm",
              `category-${category.color}`
            )}
          >
            <div className={cn(
              "flex items-center justify-between p-4 border-b border-border",
              "category-header"
            )}>
              <div className="flex items-center space-x-3">
                <IconComponent className={cn("w-5 h-5", "category-icon")} />
                <h3 className="font-medium text-foreground">{category.name}</h3>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  "category-badge"
                )}>
                  {categoryItems.length}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditCategory(category)}
                  className="p-2 text-muted-foreground hover:bg-muted rounded-full"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCategoryMutation.mutate(category.id)}
                  disabled={deleteCategoryMutation.isPending}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {categoryItems.map((item, index) => (
              <div 
                key={item.id} 
                className={cn(
                  "border-b border-border last:border-b-0",
                  "hover:bg-muted transition-colors"
                )}
              >
                <div className="flex items-center p-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleItemCheck(item)}
                      className="w-5 h-5"
                    />
                    <span 
                      className={cn(
                        "text-foreground",
                        item.checked && "line-through text-muted-foreground"
                      )}
                    >
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditItem(item);
                      }}
                      className="p-2 text-muted-foreground hover:bg-muted rounded-full"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItemMutation.mutate(item.id);
                      }}
                      disabled={deleteItemMutation.isPending}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
