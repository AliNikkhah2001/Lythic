# Design Patterns Reference

## Creational Patterns
| Pattern | Use Case | Example |
|---------|----------|---------|
| **Factory Method** | Create objects without specifying exact class | `UserFactory.create(type: 'admin' \| 'user')` |
| **Abstract Factory** | Families of related objects | `UIFactory.createButton()`, `UIFactory.createInput()` |
| **Builder** | Complex object construction | `QueryBuilder().select().where().limit().build()` |
| **Singleton** | Single instance (use sparingly) | `ConfigManager.getInstance()` |
| **Prototype** | Clone existing objects | `template.clone().modify()` |

## Structural Patterns
| Pattern | Use Case | Example |
|---------|----------|---------|
| **Adapter** | Incompatible interfaces | `LegacyApiAdapter` → `ModernApiInterface` |
| **Decorator** | Add behavior dynamically | `LoggingDecorator(authService)` |
| **Facade** | Simplify complex subsystem | `OrderFacade` → `Inventory`, `Payment`, `Shipping` |
| **Proxy** | Control access | `CacheProxy(repository)`, `AuthProxy(service)` |
| **Composite** | Tree structures | `FileSystemNode` → `File`, `Directory` |

## Behavioral Patterns
| Pattern | Use Case | Example |
|---------|----------|---------|
| **Strategy** | Interchangeable algorithms | `PaymentStrategy` → `CreditCard`, `PayPal`, `Crypto` |
| **Observer** | Event notification | `EventEmitter` → `on('user.created', handler)` |
| **Command** | Encapsulate requests | `Command` → `execute()`, `undo()` |
| **Template Method** | Algorithm skeleton | `BaseExporter` → `export()` calls `format()` |
| **State** | Behavior changes with state | `OrderState` → `Pending`, `Shipped`, `Delivered` |

## Architectural Patterns
| Pattern | Use Case | Key Principle |
|---------|----------|---------------|
| **Repository** | Data access abstraction | Domain defines interface; infra implements |
| **Unit of Work** | Transaction management | Track changes, commit atomically |
| **CQRS** | Separate read/write models | Commands mutate; Queries read |
| **Event Sourcing** | State from event log | Append-only events; rebuild state |
| **Hexagonal/Clean** | Decouple domain from infra | Ports (interfaces) + Adapters |
| **Layered** | Separation of concerns | Presentation → App → Domain → Infra |

## ML-Specific Patterns
| Pattern | Use Case |
|---------|----------|
| **Feature Store** | Centralized feature definitions, versioning, serving |
| **Model Registry** | Versioned models, metadata, promotion workflows |
| **A/B Testing** | Traffic splitting, statistical significance |
| **Canary Deployment** | Gradual rollout with metrics monitoring |
| **Pipeline** | Data → Train → Evaluate → Deploy (DAG) |

## Anti-Patterns to Avoid
- **God Class**: Single class doing too much → Split by responsibility
- **Anemic Domain Model**: Data-only classes → Rich domain with behavior
- **Circular Dependencies**: A→B→A → Invert dependency, introduce interface
- **Premature Abstraction**: YAGNI → Extract when duplication exists (Rule of 3)
- **Leaky Abstraction**: Exposing implementation details → Hide behind interfaces