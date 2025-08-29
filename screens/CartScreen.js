
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useCart } from '../CartContext';
import { supabase } from '../supabaseClient';

const CartScreen = ({ navigation }) => {
  const { cartItems, removeFromCart, clearCart } = useCart();

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Carrinho vazio", "Adicione itens ao carrinho antes de finalizar o pedido.");
      return;
    }

    const total = calculateTotal();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Create an order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        total_price: total,
        user_id: user?.id,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      Alert.alert("Erro", "Não foi possível criar o pedido.");
      return;
    }

    // 2. Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Here you might want to delete the created order as well to avoid orphaned orders
      Alert.alert("Erro", "Não foi possível salvar os itens do pedido.");
      return;
    }

    Alert.alert("Pedido finalizado!", "Seu pedido foi enviado com sucesso.");
    clearCart();
    navigation.goBack();
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name} (x{item.quantity})</Text>
        <Text style={styles.itemPrice}>R$ {(item.price * item.quantity).toFixed(2)}</Text>
      </View>
      <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>Remover</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Meu Pedido</Text>
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>Seu carrinho está vazio.</Text>}
        style={styles.list}
      />
      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: R$ {calculateTotal()}</Text>
        <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
          <Text style={styles.placeOrderButtonText}>Finalizar Pedido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: 16,
    color: '#333',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#888',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    padding: 15,
    backgroundColor: '#fff',
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 10,
  },
  placeOrderButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CartScreen;
