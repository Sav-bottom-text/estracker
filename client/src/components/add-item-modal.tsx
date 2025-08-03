import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Category } from "@shared/schema";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

export function AddItemModal({ open, onClose, categories }: AddItemModalProps) {
  const [itemName, setItemName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("box");
  const [newCategoryColor, setNewCategoryColor] = useState("blue");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const { toast } = useToast();

  const createItemMutation = useMutation({
    mutationFn: async (item: { name: string; categoryId: string; checked: boolean }) => {
      const res = await apiRequest("POST", "/api/items", item);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Item added successfully" });
      resetForm();
      onClose();
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: { name: string; icon: string; color: string }) => {
      const res = await apiRequest("POST", "/api/categories", category);
      return res.json();
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setSelectedCategoryId(newCategory.id);
      setIsCreatingCategory(false);
      setNewCategoryName("");
      toast({ title: "Category created successfully" });
    },
  });

  const resetForm = () => {
    setItemName("");
    setSelectedCategoryId("");
    setNewCategoryName("");
    setIsCreatingCategory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName.trim()) {
      toast({ title: "Please enter an item name", variant: "destructive" });
      return;
    }

    if (isCreatingCategory) {
      if (!newCategoryName.trim()) {
        toast({ title: "Please enter a category name", variant: "destructive" });
        return;
      }
      
      await createCategoryMutation.mutateAsync({
        name: newCategoryName,
        icon: newCategoryIcon,
        color: newCategoryColor,
      });
    }

    if (!selectedCategoryId) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }

    createItemMutation.mutate({
      name: itemName,
      categoryId: selectedCategoryId,
      checked: false,
    });
  };

  const handleCategoryChange = (value: string) => {
    if (value === "new") {
      setIsCreatingCategory(true);
      setSelectedCategoryId("");
    } else {
      setIsCreatingCategory(false);
      setSelectedCategoryId(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Essential</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              placeholder="e.g., Laptop, House Keys..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={isCreatingCategory ? "new" : selectedCategoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
                <SelectItem value="new">+ Create New Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCreatingCategory && (
            <>
              <div>
                <Label htmlFor="newCategoryName">New Category Name</Label>
                <Input
                  id="newCategoryName"
                  placeholder="e.g., Work Items"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="categoryIcon">Icon</Label>
                  <Select value={newCategoryIcon} onValueChange={setNewCategoryIcon}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laptop">💻 Laptop</SelectItem>
                      <SelectItem value="utensils">🍴 Utensils</SelectItem>
                      <SelectItem value="key">🔑 Key</SelectItem>
                      <SelectItem value="box">📦 Box</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="categoryColor">Color</Label>
                  <Select value={newCategoryColor} onValueChange={setNewCategoryColor}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">🔵 Blue</SelectItem>
                      <SelectItem value="green">🟢 Green</SelectItem>
                      <SelectItem value="yellow">🟡 Yellow</SelectItem>
                      <SelectItem value="purple">🟣 Purple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
          
          <DialogFooter className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createItemMutation.isPending || createCategoryMutation.isPending}
            >
              Add Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
