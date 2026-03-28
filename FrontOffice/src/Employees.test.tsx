import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Employees } from './app/components/views/Employees';
import * as employeeApi from './api/employeeApi';

// Mock the employee API functions
jest.mock('./api/employeeApi', () => ({
  getEmployees: jest.fn(),
  createEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  deleteEmployee: jest.fn(),
}));

// Mock axios for the base API
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock window.confirm
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

describe('Employees Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    
    // Default mock implementation for getEmployees
    (employeeApi.getEmployees as jest.Mock).mockResolvedValue({
      data: [
        {
          _id: '1',
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          department: 'Engineering',
          position: 'Developer',
          skillsCount: 3,
          activitiesCount: 5,
          avatar: 'J',
          role: 'EMPLOYEE',
        },
        {
          _id: '2',
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          department: 'HR',
          position: 'Manager',
          skillsCount: 2,
          activitiesCount: 3,
          avatar: 'J',
          role: 'HR',
        },
      ],
    });
  });

  // ✅ Test 1: render page
  it('renders Employees page', async () => {
    render(<Employees userRole='HR' />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /employees/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/manage employee profiles/i)).toBeInTheDocument();
  });

  // ✅ Test 2: open modal
  it('opens Add Employee modal when button is clicked', async () => {
    render(<Employees userRole='HR' />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /employees/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/add employee/i));

    expect(
      screen.getByRole('heading', { name: /add employee/i })
    ).toBeInTheDocument();
  });

  // ✅ Test 3: search input works
  it('updates search input', async () => {
    render(<Employees userRole='HR' />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by name or email/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(searchInput).toHaveValue('John');
  });

  // ✅ Test 4: creates a new employee
  it('creates a new employee when form is submitted', async () => {
    (employeeApi.createEmployee as jest.Mock).mockResolvedValue({ data: {} });

    render(<Employees userRole='HR' />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText(/add employee/i)).toBeInTheDocument();
    });

    // Open the modal
    fireEvent.click(screen.getByText(/add employee/i));

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /add employee/i })).toBeInTheDocument();
    });

    // Find form elements inside the modal
    const modal = document.querySelector('.modal');
    expect(modal).toBeTruthy();

    // Get all text inputs within the modal form (excluding search input)
    const textInputs = screen.getAllByRole('textbox');
    const formInputs = textInputs.filter(input => input.getAttribute('name') !== null && input.getAttribute('name') !== '');

    // Find inputs by name within the modal
    const nameInput = modal?.querySelector('input[name="name"]') as HTMLInputElement;
    const emailInput = modal?.querySelector('input[name="email"]') as HTMLInputElement;
    const passwordInput = modal?.querySelector('input[name="password"]') as HTMLInputElement;
    const roleSelect = modal?.querySelector('select[name="role"]') as HTMLSelectElement;

    // Fill in the form
    fireEvent.change(nameInput, { target: { value: 'New Employee' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(roleSelect, { target: { value: 'HR' } });

    // Submit the form
    const createButton = modal?.querySelector('button[type="submit"]');
    if (createButton) {
      fireEvent.click(createButton);
    }

    // Wait for the API call
    await waitFor(() => {
      expect(employeeApi.createEmployee).toHaveBeenCalled();
    });
  });

  // ✅ Test 5: deletes an employee
  it('deletes an employee when delete button is clicked', async () => {
    (employeeApi.deleteEmployee as jest.Mock).mockResolvedValue({ data: {} });

    render(<Employees userRole='HR' />);

    // Wait for employees to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click delete (the Trash2 icon button for the first employee)
    const buttons = screen.getAllByRole('button');
    const trashButton = buttons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg && svg.classList.contains('text-destructive');
    });

    if (trashButton) {
      fireEvent.click(trashButton);
    }

    // Verify confirm was called
    expect(mockConfirm).toHaveBeenCalled();

    // Verify deleteEmployee was called
    await waitFor(() => {
      expect(employeeApi.deleteEmployee).toHaveBeenCalledWith('1');
    });
  });

  // ✅ Test 6: filters employees by search term
  it('filters employees based on search input', async () => {
    render(<Employees userRole='HR' />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by name or email/i);
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  // ✅ Test 7: closes modal on cancel
  it('closes Add Employee modal when cancel is clicked', async () => {
    render(<Employees userRole='HR' />);

    await waitFor(() => {
      expect(screen.getByText(/add employee/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/add employee/i));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /add employee/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /add employee/i })).not.toBeInTheDocument();
    });
  });
});
