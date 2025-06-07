import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Info, Zap, Clock, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Notification {
  id: string;
  type: 'alert' | 'success' | 'info' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'assessment' | 'system' | 'ai' | 'workflow';
  actionRequired?: boolean;
}

interface TerraFusionNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const TerraFusionNotificationCenter: React.FC<TerraFusionNotificationCenterProps> = ({
  isOpen,
  onClose
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  // Enterprise-grade notification data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'alert',
        title: 'High-Value Property Detected',
        message: 'Property ID 2847 assessed at $2.8M - 47% above comparable values. Review recommended.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: 'high',
        category: 'assessment',
        actionRequired: true
      },
      {
        id: '2',
        type: 'success',
        title: 'AI Model Updated',
        message: 'Neural network accuracy improved to 99.2% with latest training dataset.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        priority: 'medium',
        category: 'ai'
      },
      {
        id: '3',
        type: 'info',
        title: 'Processing Milestone',
        message: '1,000th assessment completed today. System performance: 847 assessments/hour.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true,
        priority: 'medium',
        category: 'system'
      },
      {
        id: '4',
        type: 'alert',
        title: 'Data Sync Warning',
        message: 'County GIS data sync delayed by 12 minutes. Investigating connectivity issues.',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        read: false,
        priority: 'high',
        category: 'system',
        actionRequired: true
      },
      {
        id: '5',
        type: 'system',
        title: 'Weekly Report Generated',
        message: 'Comprehensive analytics report for week ending June 7, 2025 is ready for review.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
        priority: 'low',
        category: 'workflow'
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'system':
        return <Zap className="w-5 h-5 text-blue-400" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'assessment':
        return <Building className="w-4 h-4" />;
      case 'ai':
        return <Zap className="w-4 h-4" />;
      case 'system':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'high':
        return notification.priority === 'high';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-96 bg-gradient-to-b from-slate-900 to-slate-800 border-l border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Bell className="w-5 h-5 mr-2 text-cyan-400" />
              Notifications
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {unreadCount} unread, {highPriorityCount} high priority
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'high', label: 'High Priority' }
            ].map((filterOption) => (
              <Button
                key={filterOption.key}
                variant={filter === filterOption.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterOption.key as any)}
                className={filter === filterOption.key 
                  ? 'bg-cyan-500 hover:bg-cyan-600 text-white' 
                  : 'text-slate-300 border-slate-600 hover:bg-slate-700'
                }
              >
                {filterOption.label}
              </Button>
            ))}
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="mt-2 text-cyan-400 hover:text-cyan-300"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
          <div className="p-4 space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">No notifications to display</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all duration-200 hover:bg-slate-800/50 cursor-pointer ${
                    notification.read 
                      ? 'bg-slate-800/30 border-slate-700' 
                      : 'bg-slate-800/60 border-cyan-500/20'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-medium ${
                          notification.read ? 'text-slate-300' : 'text-white'
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className={`text-sm ${
                        notification.read ? 'text-slate-400' : 'text-slate-300'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(notification.priority)}`}
                          >
                            {notification.priority.toUpperCase()}
                          </Badge>
                          
                          <div className="flex items-center text-slate-400 text-xs">
                            {getCategoryIcon(notification.category)}
                            <span className="ml-1 capitalize">{notification.category}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-xs text-slate-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(notification.timestamp)}
                        </div>
                      </div>
                      
                      {notification.actionRequired && (
                        <Button
                          size="sm"
                          className="mt-3 bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default TerraFusionNotificationCenter;