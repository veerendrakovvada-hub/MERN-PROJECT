// src/components/MenuManagement.js
import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import api from '../services/api';
import toast from 'react-hot-toast';

const MenuManagement = () => {
  const { data: menuItems, loading, refetch } = useData('/menu');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', category: '', isAvailable: true });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/menu', formData);
      if (response.data.success) {
        toast.success('Menu item added successfully');
        setFormData({ name: '', price: '', category: '', isAvailable: true });
        refetch(); // Refresh the list
      }
    } catch (error) {
      toast.error('Failed to add menu item');
    }
  };

  const handleUpdate = async (id, updatedData) => {
    try {
      const response = await api.put(`/menu/${id}`, updatedData);
      if (response.data.success) {
        toast.success('Menu item updated successfully');
        refetch(); // Refresh the list
        setEditingItem(null);
      }
    } catch (error) {
      toast.error('Failed to update menu item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await api.delete(`/menu/${id}`);
        if (response.data.success) {
          toast.success('Menu item deleted successfully');
          refetch(); // Refresh the list
        }
      } catch (error) {
        toast.error('Failed to delete menu item');
      }
    }
  };

  const toggleAvailability = async (item) => {
    await handleUpdate(item.id, { ...item, isAvailable: !item.isAvailable });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Menu Management</h2>
      
      {/* Add Form */}
      <form onSubmit={handleAdd} className="mb-8 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">Add New Item</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Add Item
          </button>
        </div>
      </form>

      {/* Menu List */}
      <div className="grid gap-4">
        {menuItems.map((item) => (
          <div key={item.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-gray-600">${item.price} - {item.category}</p>
              <span className={`text-sm ${item.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {item.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => toggleAvailability(item)}
                className={`px-3 py-1 rounded ${item.isAvailable ? 'bg-yellow-500' : 'bg-green-500'} text-white`}
              >
                {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuManagement;