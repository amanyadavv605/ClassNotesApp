// src/screens/VotingScreen.js
import { useEffect, useState } from 'react';
import {
    useTheme
} from 'react-native-paper';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export default function VotingScreen() {
  const [polls, setPolls] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', ''],
  });
  const [userVotes, setUserVotes] = useState({});
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    fetchPolls();
    fetchUserVotes();
  }, []);

  const fetchPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*, poll_options(*), votes(*)')
        .order('created_at', { ascending: false });

      if (!error) {
        setPolls(data || []);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
    }
  };

  const fetchUserVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('poll_id, option_id')
        .eq('user_id', user.id);

      if (!error) {
        const votes = {};
        data.forEach(vote => {
          votes[vote.poll_id] = vote.option_id;
        });
        setUserVotes(votes);
      }
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPolls();
    await fetchUserVotes();
    setRefreshing(false);
  };

  const addPoll = async () => {
    if (!newPoll.question || newPoll.options.some(opt => !opt.trim())) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('polls')
        .insert({
          question: newPoll.question,
          created_by: user.id,
        })
        .select();

      if (data && data.length > 0) {
        const pollId = data[0].id;
        const options = newPoll.options.map(option => ({
          poll_id: pollId,
          option_text: option,
        }));

        await supabase.from('poll_options').insert(options);
        setNewPoll({ question: '', options: ['', ''] });
        setModalVisible(false);
        fetchPolls();
      }
    } catch (error) {
      console.error('Error adding poll:', error);
    }
  };
}