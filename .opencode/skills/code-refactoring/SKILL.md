# Code Refactoring Skill

## When to Refactor
- **Rule of 3**: Third time you see duplication → extract
- **Code smells**: Long method, large class, feature envy, data clumps
- **Before adding features**: Clean the area first
- **During code review**: When reviewer suggests improvement

## Refactoring Patterns

### Extract Method
```python
# Before
def process_order(order):
    # 50 lines of validation, calculation, persistence

# After
def process_order(order):
    validate_order(order)
    totals = calculate_totals(order)
    persist_order(order, totals)

def validate_order(order): ...
def calculate_totals(order): ...
def persist_order(order, totals): ...
```

### Replace Conditional with Polymorphism
```python
# Before
def shipping_cost(order):
    if order.type == 'express': return 20
    elif order.type == 'standard': return 10

# After
class ShippingStrategy: cost(self, order)
class ExpressShipping(ShippingStrategy): ...
class StandardShipping(ShippingStrategy): ...
```

### Introduce Parameter Object
```python
# Before
def create_user(name, email, phone, address, city, zip, country): ...

# After
@dataclass
class UserData:
    name: str
    email: str
    contact: ContactInfo  # phone, address grouped

def create_user(data: UserData): ...
```

### Replace Inheritance with Delegation
```python
# Before
class Stack extends ArrayList: ...

# After
class Stack:
    def __init__(self): self._items = []
    def push(self, item): self._items.append(item)
    def pop(self): return self._items.pop()
```

## Safe Refactoring Workflow
1. Ensure tests pass (run full suite)
2. Small steps: One refactoring at a time
3. Run tests after each step
4. Commit after green (separate refactor commits)
5. Use IDE refactoring tools when available

## Anti-Patterns to Fix

| Smell | Refactoring |
|-------|-------------|
| Long Method | Extract Method |
| Large Class | Extract Class |
| Duplicate Code | Extract Method/Class |
| Long Parameter List | Parameter Object |
| Feature Envy | Move Method |
| Data Clumps | Extract Class |
| Switch Statements | Polymorphism |
| Lazy Class | Inline Class |
| Speculative Generality | YAGNI - Delete |