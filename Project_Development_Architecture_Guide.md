# Project Development & Architecture Guide

Welcome to the team! This guide is designed to help you understand our project structure and how to build new features or even start a new project using our **Feature-based Organization**.

---

## **🏗️ Architecture Overview**

Our projects follow a **Feature-based Organization**. Instead of grouping code by technical layers (all controllers here, all services there), we group everything by **Business Feature**.

This structure focuses on a simple, direct flow:

```
Controller (API/Web) → Service (Domain Logic) → Database (EF Core)
```

---

### **High-Level Project Structure**

The solution is divided into several projects:

1. **`Project.Api`**

   The RESTful API layer. Controllers here receive requests and call the corresponding Domain Service.

2. **`Project.Domain`**

   The heart of the application. It contains all business logic organized by **Features**.

3. **`Project.Frontend`**

   The frontend UI (ReactJS). Pages here interact with Domain Services or the API.

4. **`Project.Shared`**

   Common utilities, constants, and the **Result Pattern** models used by everyone.

5. **`Project.Database`**

   Entity Framework Core context, migrations, and database scripts.

---

## **📂 Deep Dive: Feature-based Organization**

Every business module (e.g., User Management, Orders) is a folder under `Features/` in the Domain project.

---

### **Anatomy of a Feature Folder**

Inside a feature folder (e.g., `Features/Invoices`), you will find:

- **`Models/`**: Contains Request and Response DTOs specific to this feature.
- **`[FeatureName]Service.cs`**: The service class containing all methods for this feature (Create, Get, Update, Delete).

---

## **🔄 The Result Pattern**

We don't return raw data or throw exceptions for business logic errors. Instead, we use a **Result Pattern**. Every service method should return a `Result<T>` or `Result` object.

### **Example Service Method**

```csharp
public async Task<Result<InvoiceResponse>> CreateInvoiceAsync(InvoiceRequest request)
{
    // 1. Logic
    // 2. Database save with EF Core
    // 3. Return Result.Success(data) or Result.Failure(error)
}
```

---

## **🚀 Step-by-Step: Starting a New Project**

Follow these steps to initialize a new project with our structure:

### **Step 1: Create the Solution and Projects**

1. Create a blank .NET Solution.
2. Add the following:
   - **ASP.NET Core Web API** (`.Api`)
   - **Class Library** (`.Domain` and `.Shared`)
   - **Blazor Web App** (`.WebApp`)

---

### **Step 2: Set Up References**

- `.Domain` references `.Shared` and `.Database`.
- `.Api` and `.WebApp` reference `.Domain`.

---

### **Step 3: Organize the Domain**

1. In the `.Domain` project, create a `Features/` folder.
2. Inside `Features/`, create your feature folder (e.g., `ProductCatalog/`).
3. Inside that, create a `Models/` folder.

---

### **Step 4: Implement the Service**

1. Create your Service class (e.g., `ProductService.cs`) directly inside the feature folder.
2. Use Entity Framework Core directly in the service to perform CRUD operations.
3. Use the **Result Pattern** for all return types.

---

## **💡 Tips for Junior Developers**

1. **One Feature, One Folder**

   Everything related to a feature should stay inside its folder.

2. **Service Responsibility**

   Keep your business logic in the Service, not in the Controller or the UI.

3. **Result, Not Exceptions**

   Use `Result.Failure("Error message")` for things like "User not found" or "Insufficient balance". Reserve Exceptions for truly unexpected system crashes.

4. **Keep it Simple**

   No need for complex patterns like Mediator or CQRS. Just call the service method you need.

5. **Small Commits**

   Small changes are easier to review and harder to break.

---

## Requirements:

- Step-by-step reasoning first
- Output in this exact format: [specify]
- Make it visually appealing and demo-ready

---

Happy coding! If you're stuck, remember:

> **The "Features" folder is where the magic happens.** 🚀
