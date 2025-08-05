class EssentialTracker {
  constructor() {
    this.categories = []
    this.items = []
    this.settings = {
      theme: "light",
      animations: false, // Changed from tickAnimations to animations, default to false
      notifications: true,
      timeFormat: "24h",
      notificationTime: "08:00",
    }

    this.currentEditingCategory = null
    this.selectedColor = "#3498db"
    this.is24HourFormat = true
    this.nextResetTimer = null

    this.init()
  }

  init() {
    this.loadData()

    // Ensure DOM is ready before setting up listeners
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.setupEventListeners()
        this.applySettings()
      })
    } else {
      this.setupEventListeners()
      this.applySettings()
    }

    this.updateDateTime()
    this.renderCategories()
    this.startTimer()
    this.requestNotificationPermission()

    // Update every second
    setInterval(() => {
      this.updateDateTime()
      this.updateResetTimer()
    }, 1000)
  }

  loadData() {
    const savedCategories = localStorage.getItem("essentialTracker_categories")
    const savedItems = localStorage.getItem("essentialTracker_items")
    const savedSettings = localStorage.getItem("essentialTracker_settings")

    if (savedCategories) {
      this.categories = JSON.parse(savedCategories)
    }

    if (savedItems) {
      this.items = JSON.parse(savedItems)
    }

    if (savedSettings) {
      const loadedSettings = JSON.parse(savedSettings)

      // Handle migration from tickAnimations to animations
      if (loadedSettings.hasOwnProperty("tickAnimations") && !loadedSettings.hasOwnProperty("animations")) {
        loadedSettings.animations = false // Default to false for new animations setting
        delete loadedSettings.tickAnimations
      }

      this.settings = { ...this.settings, ...loadedSettings }
      this.applySettings()
    }

    // Check if we need to reset (new day)
    this.checkDailyReset()
  }

  saveData() {
    localStorage.setItem("essentialTracker_categories", JSON.stringify(this.categories))
    localStorage.setItem("essentialTracker_items", JSON.stringify(this.items))
    localStorage.setItem("essentialTracker_settings", JSON.stringify(this.settings))
  }

  checkDailyReset() {
    const lastReset = localStorage.getItem("essentialTracker_lastReset")
    const today = new Date().toDateString()

    if (lastReset !== today) {
      this.resetAllItems()
      localStorage.setItem("essentialTracker_lastReset", today)
    }
  }

  resetAllItems() {
    this.items.forEach((item) => {
      item.completed = false
    })
    this.saveData()
    this.renderCategories()
  }

  setupEventListeners() {
    // FAB and menu
    document.getElementById("fabBtn").addEventListener("click", () => this.toggleFabMenu())
    document.getElementById("addItemBtn").addEventListener("click", () => this.showAddItemModal())
    document.getElementById("addCategoryBtn").addEventListener("click", () => this.showAddCategoryModal())

    // Main menu
    document.getElementById("menuBtn").addEventListener("click", () => this.toggleMainMenu())
    document.getElementById("settingsBtn").addEventListener("click", () => this.showSettingsModal())
    document.getElementById("deleteAllItemsBtn").addEventListener("click", () => this.deleteAllItems())
    document.getElementById("deleteAllCategoriesBtn").addEventListener("click", () => this.deleteAllCategories())
    document.getElementById("resetNowBtn").addEventListener("click", () => {
      this.closeMainMenu()
      this.resetAllItems()
    })

    // Time format toggle
    document.getElementById("timeFormatBtn").addEventListener("click", () => this.toggleTimeFormat())

    // Notification time edit
    document.getElementById("editNotificationBtn").addEventListener("click", () => this.showEditNotificationModal())

    // Modal event listeners
    this.setupModalEventListeners()

    // Close menus on outside click
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".fab-menu") && !e.target.closest(".fab")) {
        this.closeFabMenu()
      }

      if (!e.target.closest(".dropdown-menu") && !e.target.closest(".menu-btn")) {
        this.closeMainMenu()
      }
    })
  }

  setupModalEventListeners() {
    // Close modal buttons
    document.querySelectorAll("[data-modal]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modalId =
          e.target.getAttribute("data-modal") || e.target.closest("[data-modal]").getAttribute("data-modal")
        this.closeModal(modalId)
      })
    })

    // Modal overlay
    document.getElementById("modalOverlay").addEventListener("click", () => this.closeAllModals())

    // Add item modal
    document.getElementById("saveItemBtn").addEventListener("click", () => this.saveItem())
    document.getElementById("itemNameInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.saveItem()
    })

    // Add category modal
    document.getElementById("saveCategoryBtn").addEventListener("click", () => this.saveCategory())
    document.getElementById("categoryNameInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.saveCategory()
    })

    // Edit category modal
    document.getElementById("updateCategoryBtn").addEventListener("click", () => this.updateCategory())
    document.getElementById("deleteCategoryBtn").addEventListener("click", () => this.deleteCategory())

    // Color picker
    this.setupColorPicker()

    // Settings
    this.setupSettingsListeners()

    // Notification time
    document.getElementById("saveNotificationTimeBtn").addEventListener("click", () => this.saveNotificationTime())
  }

  setupColorPicker() {
    // Add category color picker
    document.querySelectorAll("#addCategoryModal .color-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        document.querySelectorAll("#addCategoryModal .color-option").forEach((o) => o.classList.remove("selected"))
        e.target.classList.add("selected")
        this.selectedColor = e.target.getAttribute("data-color")
      })
    })

    document.getElementById("customColorPicker").addEventListener("change", (e) => {
      document.querySelectorAll("#addCategoryModal .color-option").forEach((o) => o.classList.remove("selected"))
      this.selectedColor = e.target.value
    })

    // Edit category color picker
    document.querySelectorAll("#editCategoryModal .color-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        document.querySelectorAll("#editCategoryModal .color-option").forEach((o) => o.classList.remove("selected"))
        e.target.classList.add("selected")
        this.selectedColor = e.target.getAttribute("data-color")
      })
    })

    document.getElementById("editCustomColorPicker").addEventListener("change", (e) => {
      document.querySelectorAll("#editCategoryModal .color-option").forEach((o) => o.classList.remove("selected"))
      this.selectedColor = e.target.value
    })
  }

  setupSettingsListeners() {
    // Theme buttons with debouncing
    let themeTimeout
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        clearTimeout(themeTimeout)
        themeTimeout = setTimeout(() => {
          document.querySelectorAll(".theme-btn").forEach((b) => b.classList.remove("active"))
          e.target.classList.add("active")
          this.settings.theme = e.target.getAttribute("data-theme")
          this.applySettings()
          this.saveData()
        }, 100)
      })
    })

    // Toggle switches
    const animationsToggle = document.getElementById("animationsToggle")
    if (animationsToggle) {
      animationsToggle.addEventListener("change", (e) => {
        console.log("Animations toggle changed:", e.target.checked)
        this.settings.animations = e.target.checked
        this.saveData()
      })
    }

    const notificationsToggle = document.getElementById("notificationsToggle")
    if (notificationsToggle) {
      notificationsToggle.addEventListener("change", (e) => {
        console.log("Notifications toggle changed:", e.target.checked)
        this.settings.notifications = e.target.checked
        this.saveData()
      })
    }

    // Test notification button
    const testNotificationBtn = document.getElementById("testNotificationBtn")
    if (testNotificationBtn) {
      testNotificationBtn.addEventListener("click", () => {
        console.log("Testing notification...")
        this.showNotification()
      })
    }
  }

  applySettings() {
    // Apply theme with slight delay to prevent flickering
    setTimeout(() => {
      document.body.setAttribute("data-theme", this.settings.theme)
    }, 10)

    // Update theme buttons
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-theme") === this.settings.theme)
    })

    // Update toggles safely
    const animationsToggle = document.getElementById("animationsToggle")
    if (animationsToggle) {
      animationsToggle.checked = this.settings.animations
    }

    const notificationsToggle = document.getElementById("notificationsToggle")
    if (notificationsToggle) {
      notificationsToggle.checked = this.settings.notifications
    }

    // Update time format
    this.is24HourFormat = this.settings.timeFormat === "24h"
    const timeFormatBtn = document.getElementById("timeFormatBtn")
    if (timeFormatBtn) {
      timeFormatBtn.textContent = this.is24HourFormat ? "24H" : "12H"
    }

    // Update notification time display
    const notificationTime = document.getElementById("notificationTime")
    if (notificationTime) {
      notificationTime.textContent = this.settings.notificationTime
    }
  }

  updateDateTime() {
    const now = new Date()

    // Update date (DD/MM/YY format)
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const year = String(now.getFullYear()).slice(-2)
    document.getElementById("dateDisplay").textContent = `${day}/${month}/${year}`

    // Update time
    let hours = now.getHours()
    const minutes = String(now.getMinutes()).padStart(2, "0")

    if (this.is24HourFormat) {
      document.getElementById("timeDisplay").textContent = `${String(hours).padStart(2, "0")}:${minutes}`
    } else {
      const ampm = hours >= 12 ? "PM" : "AM"
      hours = hours % 12
      hours = hours ? hours : 12
      document.getElementById("timeDisplay").textContent = `${hours}:${minutes} ${ampm}`
    }

    // Check for notification
    this.checkNotificationTime(now)
  }

  updateResetTimer() {
    const now = new Date()
    const [notifHours, notifMinutes] = this.settings.notificationTime.split(":").map(Number)

    const nextReset = new Date()
    nextReset.setHours(notifHours, notifMinutes, 0, 0)

    // If notification time has passed today, set for tomorrow
    if (nextReset <= now) {
      nextReset.setDate(nextReset.getDate() + 1)
    }

    const diff = nextReset - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    document.getElementById("resetTimer").textContent =
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  checkNotificationTime(now) {
    const [notifHours, notifMinutes] = this.settings.notificationTime.split(":").map(Number)

    if (now.getHours() === notifHours && now.getMinutes() === notifMinutes && now.getSeconds() === 0) {
      if (this.settings.notifications) {
        this.showNotification()
      }
      this.resetAllItems()
    }
  }

  requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission)
      })
    }
  }

  showNotification() {
    console.log("Attempting to show notification. Settings enabled:", this.settings.notifications)

    if (!this.settings.notifications) {
      console.log("Notifications disabled in settings")
      return
    }

    if ("Notification" in window && Notification.permission === "granted") {
      console.log("Showing notification")
      new Notification("Essential Tracker", {
        body: "Time to check your daily essentials!",
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233498db"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>',
      })
    } else {
      console.log("Notification permission status:", Notification.permission)
      if (Notification.permission === "denied") {
        console.log("Notifications are blocked. Please enable them in browser settings.")
      }
    }
  }

  toggleTimeFormat() {
    this.is24HourFormat = !this.is24HourFormat
    this.settings.timeFormat = this.is24HourFormat ? "24h" : "12h"
    document.getElementById("timeFormatBtn").textContent = this.is24HourFormat ? "24H" : "12H"
    this.saveData()
    this.updateDateTime()
  }

  toggleFabMenu() {
    const fabBtn = document.getElementById("fabBtn")
    const fabMenu = document.getElementById("fabMenu")

    fabBtn.classList.toggle("active")
    fabMenu.classList.toggle("active")
  }

  closeFabMenu() {
    document.getElementById("fabBtn").classList.remove("active")
    document.getElementById("fabMenu").classList.remove("active")
  }

  toggleMainMenu() {
    document.getElementById("mainMenu").classList.toggle("active")
  }

  closeMainMenu() {
    document.getElementById("mainMenu").classList.remove("active")
  }

  showModal(modalId) {
    document.getElementById(modalId).classList.add("active")
    document.getElementById("modalOverlay").classList.add("active")
    document.body.style.overflow = "hidden"
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active")
    document.getElementById("modalOverlay").classList.remove("active")
    document.body.style.overflow = ""
  }

  closeAllModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.remove("active")
    })
    document.getElementById("modalOverlay").classList.remove("active")
    document.body.style.overflow = ""
  }

  showAddItemModal() {
    this.closeFabMenu()
    this.populateCategorySelect()
    document.getElementById("itemNameInput").value = ""
    this.showModal("addItemModal")
    setTimeout(() => document.getElementById("itemNameInput").focus(), 100)
  }

  showAddCategoryModal() {
    this.closeFabMenu()
    document.getElementById("categoryNameInput").value = ""
    this.selectedColor = "#3498db"
    document.querySelectorAll("#addCategoryModal .color-option").forEach((o) => o.classList.remove("selected"))
    document.querySelector('#addCategoryModal .color-option[data-color="#3498db"]').classList.add("selected")
    this.showModal("addCategoryModal")
    setTimeout(() => document.getElementById("categoryNameInput").focus(), 100)
  }

  showEditCategoryModal(categoryId) {
    const category = this.categories.find((c) => c.id === categoryId)
    if (!category) return

    this.currentEditingCategory = categoryId
    document.getElementById("editCategoryNameInput").value = category.name
    document.getElementById("editCategoryNameInput").disabled = category.name === "Unsorted"
    this.selectedColor = category.color

    document.querySelectorAll("#editCategoryModal .color-option").forEach((o) => o.classList.remove("selected"))
    const colorOption = document.querySelector(`#editCategoryModal .color-option[data-color="${category.color}"]`)
    if (colorOption) {
      colorOption.classList.add("selected")
    }

    // Hide delete button for Unsorted category
    document.getElementById("deleteCategoryBtn").style.display = category.name === "Unsorted" ? "none" : "block"

    this.showModal("editCategoryModal")
    setTimeout(() => {
      if (category.name !== "Unsorted") {
        document.getElementById("editCategoryNameInput").focus()
      }
    }, 100)
  }

  showSettingsModal() {
    this.closeMainMenu()
    this.showModal("settingsModal")
  }

  showEditNotificationModal() {
    document.getElementById("notificationTimeInput").value = this.settings.notificationTime
    this.showModal("editNotificationModal")
  }

  populateCategorySelect() {
    const select = document.getElementById("itemCategorySelect")
    select.innerHTML = '<option value="unsorted">Unsorted</option>'

    this.categories.forEach((category) => {
      if (category.name !== "Unsorted") {
        const option = document.createElement("option")
        option.value = category.id
        option.textContent = category.name
        select.appendChild(option)
      }
    })
  }

  saveItem() {
    const name = document.getElementById("itemNameInput").value.trim()
    const categoryId = document.getElementById("itemCategorySelect").value

    if (!name) {
      alert("Please enter an item name")
      return
    }

    const item = {
      id: Date.now().toString(),
      name: name,
      categoryId: categoryId === "unsorted" ? "unsorted" : categoryId,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    this.items.push(item)

    // Create Unsorted category if it doesn't exist and item is unsorted
    if (categoryId === "unsorted" && !this.categories.find((c) => c.name === "Unsorted")) {
      this.createUnsortedCategory()
    }

    this.saveData()
    this.renderCategories()
    this.closeModal("addItemModal")
  }

  saveCategory() {
    const name = document.getElementById("categoryNameInput").value.trim()

    if (!name) {
      alert("Please enter a category name")
      return
    }

    if (this.categories.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
      alert("Category with this name already exists")
      return
    }

    const category = {
      id: Date.now().toString(),
      name: name,
      color: this.selectedColor,
      expanded: true,
      createdAt: new Date().toISOString(),
    }

    this.categories.push(category)
    this.saveData()
    this.renderCategories()
    this.closeModal("addCategoryModal")
  }

  updateCategory() {
    const category = this.categories.find((c) => c.id === this.currentEditingCategory)
    if (!category) return

    const name = document.getElementById("editCategoryNameInput").value.trim()

    if (category.name !== "Unsorted") {
      if (!name) {
        alert("Please enter a category name")
        return
      }

      if (
        this.categories.find((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== this.currentEditingCategory)
      ) {
        alert("Category with this name already exists")
        return
      }

      category.name = name
    }

    category.color = this.selectedColor

    this.saveData()
    this.renderCategories()
    this.closeModal("editCategoryModal")
  }

  deleteCategory() {
    if (
      !confirm("Are you sure you want to delete this category? All items in this category will be moved to Unsorted.")
    ) {
      return
    }

    const category = this.categories.find((c) => c.id === this.currentEditingCategory)
    if (!category || category.name === "Unsorted") return

    // Move items to unsorted
    this.items.forEach((item) => {
      if (item.categoryId === this.currentEditingCategory) {
        item.categoryId = "unsorted"
      }
    })

    // Create Unsorted category if needed
    if (
      this.items.some((item) => item.categoryId === "unsorted") &&
      !this.categories.find((c) => c.name === "Unsorted")
    ) {
      this.createUnsortedCategory()
    }

    // Remove category
    this.categories = this.categories.filter((c) => c.id !== this.currentEditingCategory)

    this.saveData()
    this.renderCategories()
    this.closeModal("editCategoryModal")
  }

  createUnsortedCategory() {
    const unsortedCategory = {
      id: "unsorted",
      name: "Unsorted",
      color: "#95a5a6",
      expanded: true,
      createdAt: new Date().toISOString(),
    }

    // Add at the beginning
    this.categories.unshift(unsortedCategory)
  }

  saveNotificationTime() {
    const time = document.getElementById("notificationTimeInput").value
    if (!time) return

    this.settings.notificationTime = time
    document.getElementById("notificationTime").textContent = time
    this.saveData()
    this.closeModal("editNotificationModal")
  }

  deleteAllItems() {
    if (!confirm("Are you sure you want to delete all items?")) return

    this.items = []
    this.saveData()
    this.renderCategories()
    this.closeMainMenu()
  }

  deleteAllCategories() {
    if (!confirm("Are you sure you want to delete all categories? All items will be moved to Unsorted.")) return

    // Move all items to unsorted
    this.items.forEach((item) => {
      item.categoryId = "unsorted"
    })

    // Keep only categories that shouldn't be deleted or create Unsorted if needed
    this.categories = []

    if (this.items.length > 0) {
      this.createUnsortedCategory()
    }

    this.saveData()
    this.renderCategories()
    this.closeMainMenu()
  }

  renderCategories() {
    const container = document.getElementById("categoriesContainer")

    // Remove Unsorted category if no items
    const unsortedIndex = this.categories.findIndex((c) => c.name === "Unsorted")
    if (unsortedIndex !== -1 && !this.items.some((item) => item.categoryId === "unsorted")) {
      this.categories.splice(unsortedIndex, 1)
    }

    // Sort categories: Unsorted first, then others
    const sortedCategories = this.categories.sort((a, b) => {
      if (a.name === "Unsorted") return -1
      if (b.name === "Unsorted") return 1
      return a.name.localeCompare(b.name)
    })

    if (sortedCategories.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No categories yet</h3>
                    <p>Tap the + button to add your first category or item</p>
                </div>
            `
      return
    }

    container.innerHTML = sortedCategories
      .map((category) => {
        const categoryItems = this.items.filter(
          (item) => item.categoryId === category.id || (item.categoryId === "unsorted" && category.name === "Unsorted"),
        )

        const allCompleted = categoryItems.length > 0 && categoryItems.every((item) => item.completed)
        const someCompleted = categoryItems.some((item) => item.completed)

        return `
                <div class="category">
                    <div class="category-header" onclick="app.toggleCategory('${category.id}')" style="border-left-color: ${category.color}">
                        <label class="custom-checkbox category-checkbox" onclick="event.stopPropagation()">
                            <input type="checkbox" ${allCompleted ? "checked" : ""} 
                                   onchange="app.toggleCategoryItems('${category.id}', this.checked)">
                            <span class="checkmark"></span>
                        </label>
                        <span class="category-title">${category.name}</span>
                        <div class="category-actions">
                            ${
                              category.name !== "Unsorted"
                                ? `
                                <button class="category-btn" onclick="event.stopPropagation(); app.showEditCategoryModal('${category.id}')" title="Edit Category">
                                    <i class="fas fa-edit"></i>
                                </button>
                            `
                                : `
                                <button class="category-btn" onclick="event.stopPropagation(); app.showEditCategoryModal('${category.id}')" title="Edit Color">
                                    <i class="fas fa-palette"></i>
                                </button>
                            `
                            }
                            <i class="fas fa-chevron-down dropdown-icon ${category.expanded ? "rotated" : ""}"></i>
                        </div>
                    </div>
                    <div class="category-items ${category.expanded ? "expanded" : ""}">
                        ${
                          categoryItems.length === 0
                            ? `
                            <div class="empty-state">
                                <p>No items in this category</p>
                            </div>
                        `
                            : categoryItems
                                .map(
                                  (item) => `
                            <div class="item ${item.completed ? "completed" : ""}">
                                <label class="custom-checkbox item-checkbox">
                                    <input type="checkbox" ${item.completed ? "checked" : ""} 
                                           onchange="app.toggleItem('${item.id}', this.checked)">
                                    <span class="checkmark"></span>
                                </label>
                                <span class="item-text">${item.name}</span>
                                <div class="item-actions">
                                    <button class="item-btn" onclick="app.editItem('${item.id}')" title="Edit Item">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="item-btn" onclick="app.deleteItem('${item.id}')" title="Delete Item">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `,
                                )
                                .join("")
                        }
                    </div>
                </div>
            `
      })
      .join("")
  }

  toggleCategory(categoryId) {
    const category = this.categories.find((c) => c.id === categoryId)
    if (!category) return

    category.expanded = !category.expanded
    this.saveData()
    this.renderCategories()
  }

  toggleCategoryItems(categoryId, checked) {
    const categoryItems = this.items.filter(
      (item) => item.categoryId === categoryId || (item.categoryId === "unsorted" && categoryId === "unsorted"),
    )

    categoryItems.forEach((item) => {
      item.completed = checked
    })

    this.saveData()
    this.renderCategories()
  }

  toggleItem(itemId, checked) {
    const item = this.items.find((i) => i.id === itemId)
    if (!item) return

    item.completed = checked

    // Add animation if enabled
    if (this.settings.animations) {
      const checkbox = document.querySelector(`input[onchange*="${itemId}"]`).closest(".custom-checkbox")
      if (checkbox) {
        checkbox.classList.add("animate")
        setTimeout(() => checkbox.classList.remove("animate"), 300)
      }
    } else {
      console.log("Animations are disabled")
    }

    this.saveData()

    // Update category checkbox state
    setTimeout(() => this.renderCategories(), 100)
  }

  editItem(itemId) {
    const item = this.items.find((i) => i.id === itemId)
    if (!item) return

    const newName = prompt("Edit item name:", item.name)
    if (newName && newName.trim() !== item.name) {
      item.name = newName.trim()
      this.saveData()
      this.renderCategories()
    }
  }

  deleteItem(itemId) {
    if (!confirm("Are you sure you want to delete this item?")) return

    this.items = this.items.filter((i) => i.id !== itemId)
    this.saveData()
    this.renderCategories()
  }

  startTimer() {
    // Any additional timer logic if needed
  }
}

// Initialize the app
const app = new EssentialTracker()

// Service Worker for better performance (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Service worker registration failed, but app still works
    })
  })
}
