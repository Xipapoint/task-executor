# Task System Folder Structure

The task system has been organized into a clean folder structure for better maintainability and separation of concerns.

## Folder Structure

```
apps/tasks/src/app/tasks/
├── abstracts/           # Abstract base classes and interfaces
│   └── abstract.task.ts
├── controllers/         # REST API controllers
│   └── task.controller.ts
├── docs/               # Documentation files
│   ├── README.md
│   └── TEST_ENDPOINTS.md
├── factories/          # Factory pattern implementations
│   └── task.factory.ts
├── implementations/    # Concrete task implementations
│   ├── alert-triggered.task.ts
│   ├── message-sent.task.ts
│   ├── purchased.task.ts
│   └── user-login.task.ts
├── services/           # Business logic services
│   └── task.service.ts
├── index.ts           # Barrel exports
└── task.module.ts     # NestJS module configuration
```

## Organization Principles

### 1. **Abstracts** (`/abstracts/`)
- Contains abstract base classes and interfaces
- Defines contracts that concrete implementations must follow
- Houses `AbstractTask` class and related interfaces

### 2. **Controllers** (`/controllers/`)
- Contains REST API controllers
- Handles HTTP requests and responses
- Validates input and delegates to services

### 3. **Services** (`/services/`)
- Contains business logic services
- Orchestrates task execution using factories
- Handles complex business operations

### 4. **Factories** (`/factories/`)
- Contains factory pattern implementations
- Responsible for creating appropriate task instances
- Centralizes task creation logic

### 5. **Implementations** (`/implementations/`)
- Contains concrete task implementations
- Each task type has its own file
- Extends from abstract base classes

### 6. **Documentation** (`/docs/`)
- Contains all documentation files
- API documentation and usage examples
- Test scripts and endpoint references

## Import Structure

All files use relative imports to reference components in other folders:

```typescript
// From implementations to abstracts
import { AbstractTask } from '../abstracts/abstract.task';

// From services to factories
import { TaskFactory } from '../factories/task.factory';

// From controllers to services
import { TaskService } from '../services/task.service';

// From module to all components
import { TaskController } from './controllers/task.controller';
import { TaskService } from './services/task.service';
import { UserLoginTask } from './implementations/user-login.task';
```

## Benefits of This Structure

1. **Separation of Concerns**: Each folder has a specific responsibility
2. **Maintainability**: Easy to locate and modify specific types of code
3. **Scalability**: Easy to add new components in appropriate folders
4. **Testability**: Clear structure makes testing easier
5. **Reusability**: Components are well-organized for potential reuse
6. **Code Organization**: Related files are grouped together

## Adding New Components

### New Task Implementation
1. Create new file in `/implementations/`
2. Extend from `AbstractTask`
3. Add to factory in `/factories/task.factory.ts`
4. Register in `/task.module.ts`

### New Service
1. Create new file in `/services/`
2. Add appropriate dependencies
3. Register in `/task.module.ts`

### New Controller
1. Create new file in `/controllers/`
2. Inject required services
3. Register in `/task.module.ts`

This structure provides a solid foundation for the task system that can easily accommodate future growth and changes.
